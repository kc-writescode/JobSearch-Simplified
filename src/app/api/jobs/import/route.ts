import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchJobPage } from '@/lib/job-import/fetcher';
import { extractJobText, detectSite, extractMetadata } from '@/lib/job-import/extractor';
import { parseJobWithAI } from '@/lib/job-import/ai-parser';
import { urlImportRequestSchema, textImportRequestSchema } from '@/lib/job-import/schemas';

// Rate limiting (in-memory, resets on cold start - acceptable for serverless)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // Max imports per hour
const RATE_WINDOW = 3600000; // 1 hour in ms

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const userLimit = rateLimits.get(user.id);

    if (userLimit) {
      if (userLimit.resetAt > now) {
        if (userLimit.count >= RATE_LIMIT) {
          const waitMinutes = Math.ceil((userLimit.resetAt - now) / 60000);
          return NextResponse.json({
            error: `Rate limit exceeded. Max ${RATE_LIMIT} imports per hour. Try again in ${waitMinutes} minutes.`,
          }, { status: 429 });
        }
      } else {
        // Reset expired window
        rateLimits.set(user.id, { count: 0, resetAt: now + RATE_WINDOW });
      }
    }

    const body = await request.json();
    let jobText: string | null = null;
    let sourceUrl: string | undefined;
    let metadataHints: { title?: string; company?: string; location?: string } = {};
    let extracted: any = {};

    // Determine import mode: URL or Text
    if (body.url) {
      // URL Import Mode
      const validation = urlImportRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Invalid URL format',
          details: validation.error.flatten(),
        }, { status: 400 });
      }

      sourceUrl = validation.data.url;

      // Try to fetch and extract job details (best effort - don't fail if it doesn't work)
      try {
        const { html, finalUrl } = await fetchJobPage(sourceUrl);
        sourceUrl = finalUrl; // Use final URL after redirects
        const site = detectSite(sourceUrl);
        jobText = extractJobText(html, site);
        metadataHints = extractMetadata(html);

        // Try AI extraction if we got text
        if (jobText && jobText.length >= 100) {
          try {
            extracted = await parseJobWithAI(jobText);
          } catch (aiError) {
            console.error('AI parsing error (non-fatal):', aiError);
          }
        }
      } catch (error) {
        // Fetch failed - that's OK, we'll save with minimal data
        console.log('URL fetch failed (non-fatal):', error instanceof Error ? error.message : error);
      }
    } else if (body.text) {
      // Text Import Mode (fallback)
      const validation = textImportRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Please paste at least 50 characters of job description',
          details: validation.error.flatten(),
        }, { status: 400 });
      }

      jobText = validation.data.text;
      sourceUrl = validation.data.source_url;

      // AI Extraction for text mode
      try {
        extracted = await parseJobWithAI(jobText);
      } catch (error) {
        console.error('AI parsing error:', error);
        return NextResponse.json({
          error: 'Failed to extract job details. Please try again or paste different text.',
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        error: 'Please provide either a URL or job text',
      }, { status: 400 });
    }

    // Get title and company - use extracted or generate from URL
    let title = extracted.title || metadataHints.title;
    let company = extracted.company || metadataHints.company;

    // If we couldn't extract title/company, create meaningful placeholders
    if (!title && sourceUrl) {
      // Try to extract domain as company name
      try {
        const urlObj = new URL(sourceUrl);
        const domain = urlObj.hostname.replace('www.', '').split('.')[0];
        company = company || domain.charAt(0).toUpperCase() + domain.slice(1);
        title = `Job Opening at ${company}`;
      } catch {
        title = 'Job Opening';
        company = 'Unknown Company';
      }
    }

    // For text-only mode (no URL), we need at least some info
    if (!title || !company) {
      // If we have a URL, still create the job even if extraction failed
      if (sourceUrl) {
        try {
          const urlObj = new URL(sourceUrl);
          const domain = urlObj.hostname.replace('www.', '').split('.')[0];
          title = title || `Job Opening at ${domain}`;
          company = company || domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch {
          title = title || 'Job Opening';
          company = company || 'Unknown Company';
        }
      } else {
        // Only fail if we have no URL and couldn't extract anything
        return NextResponse.json({
          error: 'Could not extract job title or company name automatically.',
          message: 'Please provide a job URL or paste more detailed job description text.',
          partial: extracted,
        }, { status: 422 });
      }
    }

    // Check for duplicate job (same URL or same title+company)
    if (sourceUrl) {
      const { data: existingByUrl } = await (supabase
        .from('jobs') as any)
        .select('id, title, company')
        .eq('user_id', user.id)
        .eq('job_url', sourceUrl)
        .single();

      if (existingByUrl) {
        return NextResponse.json({
          error: 'This job URL has already been imported',
          existing: existingByUrl,
        }, { status: 409 });
      }
    }

    // Get default resume for auto-assignment
    let defaultResumeId: string | null = body.resume_id || null;
    let availableResumes: any[] = [];

    // If resume_id not provided, try to find a default
    if (!defaultResumeId) {
      // First try to get the explicitly set default
      const { data: defaultResume } = await (supabase
        .from('resumes') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (defaultResume) {
        defaultResumeId = defaultResume.id;
      } else {
        // If no default set, check how many resumes exist
        const { data: resumes } = await (supabase
          .from('resumes') as any)
          .select('id, job_role, title, file_name')
          .eq('user_id', user.id)
          .eq('status', 'ready');

        availableResumes = resumes || [];

        if (availableResumes.length === 1) {
          defaultResumeId = availableResumes[0].id;
        } else if (availableResumes.length > 1) {
          // Multiple resumes found, but no default set
          // Return early with the extracted data so the user can pick a resume
          return NextResponse.json({
            message: 'Please select a resume to delegate this job',
            data: {
              title,
              company,
              description: extracted.description,
              location: extracted.location || metadataHints.location,
              job_url: sourceUrl,
              requirements: extracted.requirements,
              salary_range: extracted.salary_range,
              job_type: extracted.job_type,
              is_remote: extracted.remote,
            },
            confidence: extracted.confidence,
            needs_resume_selection: true,
            available_resumes: availableResumes,
          });
        }
      }
    }

    // Determine status: delegate_to_va if resume assigned, otherwise saved
    const jobStatus = defaultResumeId ? 'delegate_to_va' : 'saved';

    // Save to database
    const { data: job, error: insertError } = await (supabase
      .from('jobs') as any)
      .insert({
        user_id: user.id,
        title,
        company,
        description: extracted.description || `Job posting from ${company}. Please visit the URL for full details.`,
        location: extracted.location || metadataHints.location,
        job_url: sourceUrl,
        requirements: extracted.requirements,
        salary_range: extracted.salary_range,
        job_type: extracted.job_type,
        is_remote: extracted.remote,
        raw_import_text: jobText?.slice(0, 5000) || null,
        import_confidence: extracted.confidence || 0,
        resume_id: defaultResumeId,
        status: jobStatus,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      console.error('Attempted to insert:', {
        title,
        company,
        status: jobStatus,
        resume_id: defaultResumeId,
        has_description: !!extracted.description,
      });
      return NextResponse.json({
        error: 'Failed to save job. Please try again.',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
      }, { status: 500 });
    }

    // Update rate limit count
    const currentLimit = rateLimits.get(user.id);
    rateLimits.set(user.id, {
      count: (currentLimit?.count || 0) + 1,
      resetAt: currentLimit?.resetAt || now + RATE_WINDOW,
    });

    return NextResponse.json({
      message: defaultResumeId
        ? 'Job imported and delegated to VA'
        : 'Job imported successfully',
      data: job,
      confidence: extracted.confidence,
      needs_review: extracted.confidence < 80,
      delegated: jobStatus === 'delegate_to_va',
      resume_assigned: !!defaultResumeId,
    });
  } catch (error) {
    console.error('Job import error:', error);
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}

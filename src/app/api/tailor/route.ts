import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { tailorResumeWithAI } from '@/lib/tailor/tailor-resume';

const tailorRequestSchema = z.object({
  job_id: z.string().uuid(),
  mode: z.enum(['direct', 'queue']).optional().default('direct'),
});

// POST /api/tailor - Trigger resume tailoring for a job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = tailorRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { job_id, mode } = validationResult.data;

    // Check if user is admin
    const { data: currentProfile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = currentProfile?.role === 'admin';

    // Fetch job - admins can access any job, users only their own
    let jobQuery = (supabase
      .from('jobs') as any)
      .select('id, title, company, description, resume_id, user_id')
      .eq('id', job_id);

    if (!isAdmin) {
      jobQuery = jobQuery.eq('user_id', user.id);
    }

    const { data: job, error: jobError } = await jobQuery.single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.description) {
      return NextResponse.json(
        { error: 'Job description is required for tailoring', needs_description: true },
        { status: 400 }
      );
    }

    // Determine the user ID for resume lookup (job owner, not current user if admin)
    const resumeOwnerId = isAdmin ? job.user_id : user.id;

    // Get the resume data to use
    let resumeData = null;
    if (job.resume_id) {
      const { data: resume } = await (supabase
        .from('resumes') as any)
        .select('parsed_data')
        .eq('id', job.resume_id)
        .single();
      resumeData = resume?.parsed_data;
    }

    // Fallback to primary resume or first available if job.resume_id is not set or not found
    if (!resumeData) {
      const { data: resumes } = await (supabase
        .from('resumes') as any)
        .select('parsed_data')
        .eq('user_id', resumeOwnerId)
        .order('is_primary', { ascending: false })
        .limit(1);

      resumeData = resumes?.[0]?.parsed_data;
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Please upload and parse a resume first' },
        { status: 400 }
      );
    }

    // Check if tailored resume already exists for this job
    const { data: existingTailored } = await (supabase
      .from('tailored_resumes') as any)
      .select('id, status')
      .eq('user_id', resumeOwnerId)
      .eq('job_id', job_id)
      .single();

    let tailoredResumeId: string;

    if (existingTailored) {
      // If already processing or completed, return existing
      if (existingTailored.status === 'processing') {
        return NextResponse.json({
          message: 'Resume tailoring is already in progress',
          data: { id: existingTailored.id, status: existingTailored.status },
        });
      }

      // Reset existing record for re-tailoring
      const { error: updateError } = await (supabase
        .from('tailored_resumes') as any)
        .update({
          status: 'pending',
          error_message: null,
          tailored_summary: null,
          tailored_experience: null,
          tailored_skills: null,
          full_tailored_data: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTailored.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reset tailored resume' },
          { status: 500 }
        );
      }

      tailoredResumeId = existingTailored.id;
    } else {
      // Create new tailored_resumes record
      const { data: newTailored, error: insertError } = await (supabase
        .from('tailored_resumes') as any)
        .insert({
          user_id: resumeOwnerId,
          job_id: job_id,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to create tailored resume: ${insertError.message}` },
          { status: 500 }
        );
      }

      tailoredResumeId = newTailored.id;
    }

    // Direct mode: Process immediately for faster response
    if (mode === 'direct') {
      // Update status to processing
      await (supabase.from('tailored_resumes') as any)
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', tailoredResumeId);

      try {
        // Perform tailoring directly
        const tailoredContent = await tailorResumeWithAI(
          resumeData as any,
          job.title,
          job.company,
          job.description
        );

        // Save the tailored content
        const { error: saveError } = await (supabase.from('tailored_resumes') as any)
          .update({
            original_resume_data: resumeData,
            tailored_summary: tailoredContent.summary,
            tailored_experience: tailoredContent.experience,
            tailored_skills: tailoredContent.highlighted_skills,
            full_tailored_data: tailoredContent,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tailoredResumeId);

        if (saveError) throw saveError;

        // Update job status to 'tailored'
        await (supabase.from('jobs') as any)
          .update({ status: 'tailored', updated_at: new Date().toISOString() })
          .eq('id', job_id);

        return NextResponse.json({
          message: 'Resume tailoring completed',
          data: {
            id: tailoredResumeId,
            status: 'completed',
            tailored: tailoredContent,
            job: { id: job.id, title: job.title, company: job.company },
          },
        });
      } catch (tailorError: any) {
        // Mark as failed
        const errorMessage = tailorError?.message || 'Tailoring failed';
        const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('400');

        await (supabase.from('tailored_resumes') as any)
          .update({
            status: 'failed',
            error_message: isApiKeyError ? 'AI Service Error: Invalid API Key. Please check Vercel settings.' : errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tailoredResumeId);

        console.error('Direct tailoring error:', tailorError);

        return NextResponse.json(
          {
            error: isApiKeyError ? 'AI Configuration Error: Invalid API Key' : 'Failed to tailor resume',
            details: errorMessage
          },
          { status: 500 }
        );
      }
    }

    // Queue mode: Use background worker (requires Redis)
    try {
      const { getTailorResumeQueue } = await import('@/lib/queue/queues');
      const queue = getTailorResumeQueue();
      const queueJob = await queue.add(
        `tailor-${job_id}`,
        { jobId: job_id, userId: user.id, tailoredResumeId },
        { jobId: `tailor-${user.id}-${job_id}` }
      );

      return NextResponse.json({
        message: 'Resume tailoring started',
        data: {
          id: tailoredResumeId,
          queue_job_id: queueJob.id,
          status: 'pending',
          job: { id: job.id, title: job.title, company: job.company },
        },
      });
    } catch (queueError) {
      console.error('Queue error, falling back to direct mode:', queueError);
      // Fallback to direct processing if queue fails
      return NextResponse.json(
        { error: 'Queue not available. Please try again.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Tailor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tailor?job_id=xxx - Get tailored resume status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      // Return all tailored resumes for user
      const { data: tailoredResumes, error } = await (supabase
        .from('tailored_resumes') as any)
        .select(`
          *,
          jobs:job_id (
            id,
            title,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: tailoredResumes });
    }

    // Return specific tailored resume
    const { data: tailoredResume, error } = await (supabase
      .from('tailored_resumes') as any)
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          company
        )
      `)
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    return NextResponse.json({ data: tailoredResume });
  } catch (error) {
    console.error('Tailor GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

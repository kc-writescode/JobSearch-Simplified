import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiModel } from '@/lib/ai/gemini';

// POST /api/cover-letter - Generate cover letter for a job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    // Check if user is admin
    const { data: currentProfile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = currentProfile?.role === 'admin';

    // Fetch job details - admins can access any job, users only their own
    let jobQuery = (supabase
      .from('jobs') as any)
      .select('id, title, company, description, resume_id, user_id')
      .eq('id', job_id);

    // Only filter by user_id if not admin
    if (!isAdmin) {
      jobQuery = jobQuery.eq('user_id', user.id);
    }

    const { data: job, error: jobError } = await jobQuery.single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.description) {
      return NextResponse.json(
        { error: 'Job description is required for cover letter generation' },
        { status: 400 }
      );
    }

    // Fetch the job owner's profile (for their personal details in the cover letter)
    // If admin is generating, use the job owner's profile, not the admin's
    const profileUserId = isAdmin ? job.user_id : user.id;
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('full_name, email, phone, linkedin_url, resume_data')
      .eq('id', profileUserId)
      .single();

    // Fetch resume if attached
    let resumeText = '';
    if (job.resume_id) {
      const { data: resume } = await (supabase
        .from('resumes') as any)
        .select('parsed_text')
        .eq('id', job.resume_id)
        .single();

      if (resume?.parsed_text) {
        resumeText = resume.parsed_text;
      }
    }

    // Generate cover letter using OpenAI
    const prompt = `Generate a professional cover letter for the following job application.

Job Title: ${job.title}
Company: ${job.company}
Job Description:
${job.description}

Applicant Name: ${profile?.full_name || 'Applicant'}
${resumeText ? `\nApplicant Resume:\n${resumeText.substring(0, 3000)}` : ''}

Write a compelling, professional cover letter that:
1. Starts directly with "Dear Hiring Manager," (Do NOT include any top headers, contact details, dates, or addresses).
2. Opens with enthusiasm for the specific role
3. Highlights relevant experience and skills that match the job requirements
4. Shows understanding of the company and role
5. Is concise (about 300-400 words)
6. Closes with a clear call to action
7. Signs off with "Sincerely," followed by the applicant name. Do NOT include placeholders for LinkedIn, Portfolio, or Address at the bottom.

Output only the body of the cover letter starting from the salutation.`;

    const model = getGeminiModel('gemini-1.5-flash');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1024,
      }
    });

    const coverLetter = result.response.text() || '';

    // Save cover letter to job
    const { error: updateError } = await (supabase
      .from('jobs') as any)
      .update({
        cover_letter: coverLetter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (updateError) {
      console.error('Error saving cover letter:', updateError);
    }

    return NextResponse.json({
      message: 'Cover letter generated',
      cover_letter: coverLetter,
    });
  } catch (error) {
    console.error('Cover letter API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}

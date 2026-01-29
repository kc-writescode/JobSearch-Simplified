import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCoverLetterWithOpenAI } from '@/lib/tailor/openai-cover-letter';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { job_id } = body;

        if (!job_id) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // 1. Fetch job, profile, and resume ID
        const { data: job, error: jobError } = await (supabase
            .from('jobs') as any)
            .select('description, client_notes, resume_id, profiles!user_id(full_name, global_notes)')
            .eq('id', job_id)
            .eq('user_id', user.id)
            .single();

        if (jobError || !job) {
            console.error('Job fetch error:', jobError);
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (!job.resume_id) {
            return NextResponse.json({ error: 'Please select a resume for this job first.' }, { status: 400 });
        }

        if (!job.description) {
            return NextResponse.json({ error: 'Job description is required for generation.' }, { status: 400 });
        }

        // Handle profile data join
        const profileData = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
        const candidateName = profileData?.full_name || 'Candidate';
        const globalInstructions = profileData?.global_notes || '';

        // 2. Fetch resume text
        const { data: resume, error: resumeError } = await (supabase.from('resumes') as any)
            .select('parsed_text')
            .eq('id', job.resume_id)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // 3. Generate cover letter
        const coverLetter = await generateCoverLetterWithOpenAI(
            candidateName,
            resume.parsed_text || '',
            job.description,
            job.client_notes || '',
            globalInstructions
        );

        // 4. Update job record
        const { error: updateError } = await (supabase.from('jobs') as any)
            .update({
                cover_letter: coverLetter,
                updated_at: new Date().toISOString()
            })
            .eq('id', job_id);

        if (updateError) {
            console.error('Update job error:', updateError);
            throw updateError;
        }

        return NextResponse.json({ success: true, cover_letter: coverLetter });

    } catch (error: any) {
        console.error('Cover letter API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

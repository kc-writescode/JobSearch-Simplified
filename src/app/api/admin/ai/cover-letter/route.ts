import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCoverLetterWithOpenAI } from '@/lib/tailor/openai-cover-letter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.json();
        const { taskId, resumeId, jobDescription, clientNotes, globalInstructions } = body;

        if (!taskId || !resumeId || !jobDescription) {
            return NextResponse.json(
                { error: 'Task ID, Resume ID, and Job Description are required' },
                { status: 400 }
            );
        }

        // 1. Fetch job and candidate info
        const { data: job, error: jobError } = await (supabase
            .from('jobs') as any)
            .select('user_id, profiles!user_id(full_name)')
            .eq('id', taskId)
            .maybeSingle();

        if (jobError) {
            console.error('Database error fetching job:', jobError);
            return NextResponse.json({ error: 'Database error: ' + jobError.message }, { status: 500 });
        }

        if (!job) {
            console.error('Job not found for ID:', taskId);
            return NextResponse.json({ error: 'Job not found for ID: ' + taskId }, { status: 404 });
        }

        // Handle case where profiles might be an object or an array
        const profileData = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
        const candidateName = profileData?.full_name || 'Candidate';

        // 2. Fetch resume text
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('parsed_text')
            .eq('id', resumeId)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // 3. Generate cover letter
        const coverLetter = await generateCoverLetterWithOpenAI(
            candidateName,
            resume.parsed_text,
            jobDescription,
            clientNotes || '',
            globalInstructions || ''
        );

        // 3. Save to job record
        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                cover_letter: coverLetter,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, coverLetter });

    } catch (error: any) {
        console.error('Cover letter API error:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}

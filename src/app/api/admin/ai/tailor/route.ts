import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tailorWithOpenAI } from '@/lib/tailor/openai-tailor';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.json();
        const { taskId, resumeId, jobDescription } = body;

        if (!taskId || !resumeId || !jobDescription) {
            return NextResponse.json(
                { error: 'Task ID, Resume ID, and Job Description are required' },
                { status: 400 }
            );
        }

        // 1. Fetch the resume data
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json(
                { error: 'Resume not found' },
                { status: 404 }
            );
        }

        // 2. Fetch the job data to get user_id
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('user_id')
            .eq('id', taskId)
            .single();

        if (jobError || !job) {
            return NextResponse.json(
                { error: 'Job/Task not found' },
                { status: 404 }
            );
        }

        // 3. Update status in tailored_resumes (or create if doesn't exist)
        const { data: existingTailored, error: existingError } = await supabase
            .from('tailored_resumes')
            .select('id')
            .eq('job_id', taskId)
            .single();

        let tailoredId;
        if (existingTailored) {
            tailoredId = existingTailored.id;
            await supabase
                .from('tailored_resumes')
                .update({ status: 'processing', error_message: null })
                .eq('id', tailoredId);
        } else {
            const { data: newTailored, error: createError } = await supabase
                .from('tailored_resumes')
                .insert({
                    user_id: job.user_id,
                    job_id: taskId,
                    status: 'processing'
                })
                .select()
                .single();

            if (createError) throw createError;
            tailoredId = newTailored.id;
        }

        // 4. Update job status to show we are working on it
        await supabase
            .from('jobs')
            .update({ ai_status: 'In Progress' })
            .eq('id', taskId);

        // 5. Perform the tailoring
        try {
            const tailoredResult = await tailorWithOpenAI(
                resume.parsed_text,
                jobDescription,
                resume.parsed_data?.experience || []
            );

            // Save the results
            const { error: saveError } = await supabase
                .from('tailored_resumes')
                .update({
                    tailored_summary: tailoredResult.summary,
                    tailored_experience: tailoredResult.experience, // This is JSONB
                    tailored_skills: tailoredResult.highlighted_skills,
                    full_tailored_data: {
                        match_score: tailoredResult.match_score,
                        keywords_matched: tailoredResult.keywords_matched,
                        keywords_missing: tailoredResult.keywords_missing
                    },
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', tailoredId);

            if (saveError) throw saveError;

            // Update job status
            await supabase
                .from('jobs')
                .update({ ai_status: 'Completed' })
                .eq('id', taskId);

            return NextResponse.json({ success: true, data: tailoredResult });

        } catch (aiError: any) {
            console.error('Tailoring engine error:', aiError);

            await supabase
                .from('tailored_resumes')
                .update({ status: 'failed', error_message: aiError.message })
                .eq('id', tailoredId);

            await supabase
                .from('jobs')
                .update({ ai_status: 'Error' })
                .eq('id', taskId);

            return NextResponse.json(
                { error: 'Tailoring failed: ' + aiError.message },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}

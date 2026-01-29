import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tailorWithOpenAI } from '@/lib/tailor/openai-tailor';

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

        // 1. Fetch job and resume
        const { data: job, error: jobError } = await (supabase
            .from('jobs') as any)
            .select('description, resume_id')
            .eq('id', job_id)
            .eq('user_id', user.id)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (!job.resume_id) {
            return NextResponse.json({ error: 'Please select a resume for this job first.' }, { status: 400 });
        }

        if (!job.description) {
            return NextResponse.json({ error: 'Job description is required for tailoring.' }, { status: 400 });
        }

        // 2. Fetch resume text and data
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', job.resume_id)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // 3. Check/Create tailored_resumes record
        const { data: existingTailored } = await (supabase
            .from('tailored_resumes') as any)
            .select('id')
            .eq('job_id', job_id)
            .maybeSingle();

        let tailoredId;
        if (existingTailored) {
            tailoredId = existingTailored.id;
            await (supabase.from('tailored_resumes') as any)
                .update({ status: 'processing', error_message: null })
                .eq('id', tailoredId);
        } else {
            const { data: newTailored, error: createError } = await (supabase.from('tailored_resumes') as any)
                .insert({
                    user_id: user.id,
                    job_id: job_id,
                    status: 'processing'
                })
                .select()
                .single();

            if (createError) throw createError;
            tailoredId = newTailored.id;
        }

        // 4. Perform tailoring
        try {
            const tailoredResult = await tailorWithOpenAI(
                resume.parsed_text,
                job.description,
                resume.parsed_data?.experience || []
            );

            // 5. Save results
            const { error: saveError } = await (supabase.from('tailored_resumes') as any)
                .update({
                    tailored_summary: tailoredResult.summary,
                    tailored_experience: tailoredResult.experience,
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

            return NextResponse.json({
                success: true,
                data: {
                    status: 'completed',
                    tailored: tailoredResult
                }
            });

        } catch (aiError: any) {
            console.error('Tailoring error:', aiError);
            await (supabase.from('tailored_resumes') as any)
                .update({ status: 'failed', error_message: aiError.message })
                .eq('id', tailoredId);

            return NextResponse.json({ error: aiError.message }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Tailor API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

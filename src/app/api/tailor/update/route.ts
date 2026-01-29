import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { job_id, tailored_summary, tailored_experience, tailored_skills, cover_letter } = body;

        if (!job_id) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // 1. Update tailored_resumes record
        const { error: tailorError } = await (supabase.from('tailored_resumes') as any)
            .update({
                tailored_summary,
                tailored_experience,
                tailored_skills,
                updated_at: new Date().toISOString()
            })
            .eq('job_id', job_id)
            .eq('user_id', user.id);

        if (tailorError) {
            console.error('Tailor update error:', tailorError);
            throw tailorError;
        }

        // 2. Update cover letter in jobs table
        if (cover_letter !== undefined) {
            const { error: jobError } = await (supabase.from('jobs') as any)
                .update({
                    cover_letter,
                    updated_at: new Date().toISOString()
                })
                .eq('id', job_id)
                .eq('user_id', user.id);

            if (jobError) {
                console.error('Job update error:', jobError);
                throw jobError;
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

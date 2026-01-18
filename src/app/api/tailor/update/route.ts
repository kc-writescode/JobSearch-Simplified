import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateRequestSchema = z.object({
    job_id: z.string().uuid(),
    tailored_summary: z.string(),
    tailored_experience: z.array(z.any()),
    tailored_skills: z.array(z.string()).optional(),
});

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
        const validationResult = updateRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { job_id, tailored_summary, tailored_experience, tailored_skills } = validationResult.data;

        // Fetch existing tailored resume
        const { data: existing, error: fetchError } = await (supabase
            .from('tailored_resumes') as any)
            .select('*')
            .eq('job_id', job_id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
        }

        // Merge updates into full_tailored_data
        const fullTailoredData = (existing.full_tailored_data as any) || {};
        const updatedFullData = {
            ...fullTailoredData,
            summary: tailored_summary,
            experience: tailored_experience,
            highlighted_skills: tailored_skills || fullTailoredData.highlighted_skills,
        };

        // Update record
        const { error: updateError } = await (supabase
            .from('tailored_resumes') as any)
            .update({
                tailored_summary,
                tailored_experience,
                tailored_skills: tailored_skills || existing.tailored_skills,
                full_tailored_data: updatedFullData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update tailored resume' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Tailor API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

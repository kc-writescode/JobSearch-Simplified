import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/tailor/[id] - Update tailored resume
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tailored_summary, tailored_experience } = body;

    // Verify ownership
    const { data: existing, error: fetchError } = await (supabase
      .from('tailored_resumes') as any)
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    // Update the record
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (tailored_summary !== undefined) {
      updateData.tailored_summary = tailored_summary;
    }

    if (tailored_experience !== undefined) {
      updateData.tailored_experience = tailored_experience;
    }

    const { data: updated, error: updateError } = await (supabase
      .from('tailored_resumes') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Tailor PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/tailor/[id] - Get specific tailored resume
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    return NextResponse.json({ data: tailoredResume });
  } catch (error) {
    console.error('Tailor GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Set a resume as default
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resume_id } = await request.json();

    if (!resume_id) {
      return NextResponse.json({ error: 'resume_id is required' }, { status: 400 });
    }

    // Verify resume belongs to user
    const { data: resume, error: fetchError } = await (supabase
      .from('resumes') as any)
      .select('id')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Unset any existing default
    await (supabase.from('resumes') as any)
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);

    // Set the new default
    const { error: updateError } = await (supabase
      .from('resumes') as any)
      .update({ is_default: true })
      .eq('id', resume_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Default resume set' });
  } catch (error) {
    console.error('Error setting default resume:', error);
    return NextResponse.json({ error: 'Failed to set default resume' }, { status: 500 });
  }
}

// Remove default from a resume
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resume_id = searchParams.get('resume_id');

    if (!resume_id) {
      return NextResponse.json({ error: 'resume_id is required' }, { status: 400 });
    }

    const { error: updateError } = await (supabase
      .from('resumes') as any)
      .update({ is_default: false })
      .eq('id', resume_id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Default removed' });
  } catch (error) {
    console.error('Error removing default:', error);
    return NextResponse.json({ error: 'Failed to remove default' }, { status: 500 });
  }
}

// Get the default resume for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First try to get the explicitly set default
    let { data: defaultResume } = await (supabase
      .from('resumes') as any)
      .select('id, job_role, title, file_name')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    // If no default set, check if there's only one resume (auto-default)
    if (!defaultResume) {
      const { data: resumes, count } = await (supabase
        .from('resumes') as any)
        .select('id, job_role, title, file_name', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'ready');

      if (count === 1 && resumes?.[0]) {
        defaultResume = resumes[0];
      }
    }

    return NextResponse.json({
      default_resume: defaultResume || null,
      has_default: !!defaultResume
    });
  } catch (error) {
    console.error('Error getting default resume:', error);
    return NextResponse.json({ error: 'Failed to get default resume' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createApplicationSchema = z.object({
  job_id: z.string().uuid(),
  resume_id: z.string().uuid().optional(),
  cover_letter: z.string().optional(),
  status: z.enum([
    'draft', 'submitted', 'under_review', 'interview_scheduled',
    'interviewed', 'offer_received', 'accepted', 'rejected', 'withdrawn'
  ]).default('draft'),
  notes: z.string().optional(),
  confidence_score: z.number().min(1).max(5).optional(),
});

// GET /api/applications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const jobId = searchParams.get('job_id');

    let query = supabase
      .from('applications')
      .select(`
        *,
        job:jobs(id, title, company),
        resume:resumes(id, title, file_name)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: applications, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: applications,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Verify job belongs to user
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', validationResult.data.job_id)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        ...validationResult.data,
        applied_at: validationResult.data.status === 'submitted' ? new Date().toISOString() : null,
      })
      .select(`
        *,
        job:jobs(id, title, company),
        resume:resumes(id, title)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Application for this job already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

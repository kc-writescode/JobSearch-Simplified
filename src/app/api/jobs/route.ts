import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Status mappings for each tab
const TAB_STATUSES: Record<string, string[]> = {
  saved: ['saved', 'tailored', 'tailoring'],
  applying: ['delegate_to_va'],
  applied: ['applied', 'interviewing', 'offer'],
  trashed: ['trashed'],
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'applying';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const labels = searchParams.get('labels') || '';

    const statuses = TAB_STATUSES[tab] || TAB_STATUSES.applying;

    // ── 1. Fetch tab counts and all unique labels (lightweight query) ──
    const { data: allJobsLight } = await (supabase
      .from('jobs') as any)
      .select('status, labels')
      .eq('user_id', user.id);

    const counts = {
      saved: 0,
      applying: 0,
      applied: 0,
      trashed: 0,
    };
    const allUniqueLabels = new Set<string>();

    if (allJobsLight) {
      for (const row of allJobsLight) {
        // Counts
        if (['saved', 'tailored', 'tailoring'].includes(row.status)) counts.saved++;
        else if (row.status === 'delegate_to_va') counts.applying++;
        else if (['applied', 'interviewing', 'offer'].includes(row.status)) counts.applied++;
        else if (row.status === 'trashed') counts.trashed++;

        // Labels
        if (row.labels && Array.isArray(row.labels)) {
          row.labels.forEach((l: string) => allUniqueLabels.add(l));
        }
      }
    }

    // ── 2. Build the paginated query for the active tab ──
    let query = (supabase.from('jobs') as any)
      .select('id, delegated_job_id, title, company, status, job_url, location, description, resume_id, cover_letter, submission_proof, custom_resume_proof, applied_at, created_at, client_notes, labels, cannot_apply_reason', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', statuses)
      .order('created_at', { ascending: false });

    // Apply search filter at DB level
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`title.ilike.${q},company.ilike.${q},location.ilike.${q}`);
    }

    // Apply label filter at DB level
    if (labels) {
      const labelArr = labels.split(',').filter(Boolean);
      if (labelArr.length > 0) {
        // Supabase array overlap: labels column contains any of the filter labels
        query = query.overlaps('labels', labelArr);
      }
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: jobs, count: total, error } = await query;

    if (error) {
      console.error('Jobs query error:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // ── 3. Fetch tailored_resume statuses for the returned jobs ──
    const jobIds = (jobs || []).map((j: any) => j.id);
    let tailoredMap: Record<string, string> = {};

    if (jobIds.length > 0) {
      const { data: tailoredData } = await (supabase
        .from('tailored_resumes') as any)
        .select('job_id, status')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      if (tailoredData) {
        for (const tr of tailoredData) {
          tailoredMap[tr.job_id] = tr.status;
        }
      }
    }

    // Merge tailored status into jobs
    const jobsWithTailored = (jobs || []).map((job: any) => ({
      ...job,
      tailored_status: tailoredMap[job.id] || null,
    }));

    return NextResponse.json({
      jobs: jobsWithTailored,
      total: total || 0,
      counts,
      labels: Array.from(allUniqueLabels),
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

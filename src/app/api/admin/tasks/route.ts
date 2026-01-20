import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VACoreTask, TaskStatus, AIStatus, ClientPriority } from '@/types/admin.types';

// GET: Fetch all jobs as tasks with resume info
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const searchParams = request.nextUrl.searchParams;
    const statusFilters = searchParams.getAll('status');
    const priorityFilters = searchParams.getAll('priority');
    const search = searchParams.get('search') || '';

    // Fetch all jobs with resume relationship
    let query = supabase
      .from('jobs')
      .select('*, resume:resumes(id, file_name, file_path, job_role, title, status)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // If no status filter includes Trashed, exclude trashed jobs
    const includesTrashed = statusFilters.includes('Trashed');
    if (!includesTrashed && statusFilters.length === 0) {
      query = query.neq('status', 'trashed');
    }

    // Apply status filter
    if (statusFilters.length > 0) {
      const jobStatuses = statusFilters.flatMap(mapTaskStatusToJobStatuses);
      query = query.in('status', jobStatuses);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ data: [], total: 0 }, { status: 200 });
    }

    // Fetch related data
    const userIds = [...new Set(jobs.map(job => job.user_id))];
    const jobIds = jobs.map(job => job.id);

    const [profilesRes, tailoredRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, plan, phone, linkedin_url, personal_details').in('id', userIds),
      supabase.from('tailored_resumes').select('job_id, status, id, full_tailored_data').in('job_id', jobIds),
    ]);

    const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
    const tailoredMap = new Map(tailoredRes.data?.map(t => [t.job_id, t]) || []);

    // Transform jobs to VACoreTask format
    let tasks: VACoreTask[] = jobs.map(job => {
      const profile = profilesMap.get(job.user_id);
      const tailored = tailoredMap.get(job.id);
      const isPremium = profile?.plan?.toLowerCase() === 'premium' || profile?.plan?.toLowerCase() === 'pro';
      const resumeInfo = job.resume as any;
      const fullTailoredData = tailored?.full_tailored_data as any;

      return {
        id: job.id,
        jobId: job.id,
        delegatedJobId: job.delegated_job_id,
        clientId: job.user_id,
        clientName: profile?.full_name || 'Unknown',
        clientEmail: profile?.email || '',
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.job_url || '',
        deadline: job.created_at,
        status: mapJobStatusToTaskStatus(job.status),
        priority: (isPremium ? 'Premium' : 'Standard') as ClientPriority,
        aiStatus: mapAIStatus(tailored?.status),
        personalDetails: {
          full_name: profile?.full_name || '',
          email: profile?.email || '',
          phone: profile?.phone,
          linkedin_url: profile?.linkedin_url,
        },
        // Resume info for VA
        selectedResume: resumeInfo ? {
          id: resumeInfo.id,
          title: resumeInfo.job_role || resumeInfo.title || resumeInfo.file_name,
          job_role: resumeInfo.job_role,
          file_path: resumeInfo.file_path,
          status: resumeInfo.status,
        } : undefined,
        // Tailored resume info
        tailoredResumeId: tailored?.id,
        matchAnalytics: fullTailoredData ? {
          score: fullTailoredData.match_score || 0,
          matched_keywords: fullTailoredData.keywords_matched || [],
          missing_keywords: fullTailoredData.keywords_missing || [],
        } : undefined,
        fullTailoredData: fullTailoredData ? {
          summary: fullTailoredData.summary || '',
          experience: fullTailoredData.experience || [],
          skills: fullTailoredData.highlighted_skills || (tailored as any)?.tailored_skills || [],
        } : undefined,
        coverLetter: job.cover_letter,
        cannotApplyReason: job.cannot_apply_reason,
        proofOfWork: job.submission_proof ? {
          screenshotUrl: job.submission_proof,
          submittedAt: job.applied_at,
        } : undefined,
        profileDetails: profile?.personal_details,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    });

    // Apply priority filter
    if (priorityFilters.length > 0) {
      tasks = tasks.filter(task => priorityFilters.includes(task.priority));
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(
        task =>
          task.jobTitle.toLowerCase().includes(searchLower) ||
          task.clientName.toLowerCase().includes(searchLower) ||
          task.company.toLowerCase().includes(searchLower) ||
          task.delegatedJobId?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ data: tasks, total: tasks.length }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST: Create a new job/task
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { title, company, description, jobUrl, userId, resumeId } = body;

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        title,
        company,
        description,
        job_url: jobUrl,
        resume_id: resumeId,
        status: 'saved',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// Helper functions
function mapTaskStatusToJobStatuses(taskStatus: string): string[] {
  switch (taskStatus) {
    case 'Applying': return ['saved', 'tailored', 'delegate_to_va'];
    case 'Applied': return ['applied'];
    case 'Trashed': return ['trashed'];
    default: return ['saved', 'tailored', 'delegate_to_va'];
  }
}

function mapJobStatusToTaskStatus(jobStatus: string): TaskStatus {
  switch (jobStatus) {
    case 'saved':
    case 'tailored':
    case 'delegate_to_va':
      return 'Applying';
    case 'applied':
      return 'Applied';
    case 'trashed':
      return 'Trashed';
    default:
      return 'Applying';
  }
}

function mapAIStatus(status: string | null | undefined): AIStatus {
  switch (status) {
    case 'pending': return 'Pending';
    case 'processing': return 'In Progress';
    case 'completed': return 'Completed';
    case 'failed': return 'Error';
    default: return 'Pending';
  }
}

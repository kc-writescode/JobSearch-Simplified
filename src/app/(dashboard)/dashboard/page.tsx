import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientDashboard } from './client-dashboard';

interface Profile {
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  personal_details?: any;
}

interface TailoredResume {
  job_id: string;
  status: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profileData } = await (supabase
    .from('profiles') as any)
    .select('full_name, phone, linkedin_url, github_url, personal_details')
    .eq('id', user.id)
    .single();

  const profile = profileData as Profile | null;

  // Fetch all user's resumes
  const { data: resumes } = await (supabase
    .from('resumes') as any)
    .select('id, file_name, file_path, job_role, title, created_at, status, is_default')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch jobs
  const { data: jobs } = await (supabase
    .from('jobs') as any)
    .select('id, title, company, status, job_url, location, description, resume_id, cover_letter, submission_proof, applied_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch tailored resume statuses for all user's jobs
  const { data: tailoredResumes } = await (supabase
    .from('tailored_resumes') as any)
    .select('job_id, status')
    .eq('user_id', user.id);

  // Create a map of job_id -> tailored resume status
  const tailoredStatusMap: Record<string, string> = {};
  if (tailoredResumes) {
    (tailoredResumes as TailoredResume[]).forEach((tr) => {
      tailoredStatusMap[tr.job_id] = tr.status;
    });
  }

  // Add tailored status to each job
  const jobsWithTailoredStatus = (jobs || []).map((job: { id: string }) => ({
    ...job,
    tailored_status: tailoredStatusMap[job.id] || null,
  }));

  return (
    <ClientDashboard
      profile={{
        full_name: profile?.full_name || null,
        email: user.email || '',
        phone: profile?.phone || null,
        linkedin_url: profile?.linkedin_url || null,
        github_url: profile?.github_url || null,
        personal_details: profile?.personal_details || null,
      }}
      resumes={resumes || []}
      jobs={jobsWithTailoredStatus}
    />
  );
}

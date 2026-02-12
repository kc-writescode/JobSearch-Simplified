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

  // Fetch profile (including feature_access and credits for gating)
  const { data: profileData } = await (supabase
    .from('profiles') as any)
    .select('full_name, phone, linkedin_url, github_url, personal_details, certifications, global_notes, feature_access, credits')
    .eq('id', user.id)
    .single();

  const profile = profileData as Profile | null;

  // Fetch all user's resumes (including parsed_data for skills)
  const { data: resumes } = await (supabase
    .from('resumes') as any)
    .select('id, file_name, file_path, job_role, title, created_at, status, is_default, parsed_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get default resume's skills
  const getDefaultResumeSkills = () => {
    if (!resumes || resumes.length === 0) return [];
    // First check for explicitly set default
    const explicitDefault = resumes.find((r: any) => r.is_default);
    if (explicitDefault?.parsed_data?.skills) return explicitDefault.parsed_data.skills;
    // If only one resume, use its skills
    if (resumes.length === 1 && resumes[0].parsed_data?.skills) return resumes[0].parsed_data.skills;
    return [];
  };

  const defaultResumeSkills = getDefaultResumeSkills();

  return (
    <ClientDashboard
      profile={{
        full_name: profile?.full_name || null,
        email: user.email || '',
        phone: (profileData as any)?.phone || null,
        linkedin_url: (profileData as any)?.linkedin_url || null,
        github_url: (profileData as any)?.github_url || null,
        personal_details: (profileData as any)?.personal_details || null,
        certifications: (profileData as any)?.certifications || [],
        global_notes: (profileData as any)?.global_notes || '',
        feature_access: (profileData as any)?.feature_access || { cover_letter_enabled: false, resume_tailor_enabled: false, custom_resume_enabled: false },
        credits: (profileData as any)?.credits || 0,
        resume_skills: defaultResumeSkills,
      }}
      resumes={resumes || []}
      initialJobs={[]}
    />
  );
}

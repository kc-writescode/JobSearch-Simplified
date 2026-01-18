import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TailoringReview } from './tailoring-review';

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function TailorReviewPage({ params }: PageProps) {
  const { jobId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Fetch job details
  const { data: job, error: jobError } = await (supabase
    .from('jobs') as any)
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) {
    notFound();
  }

  // Fetch user's base resume
  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('resume_data')
    .eq('id', user.id)
    .single();

  // Fetch tailored resume (may not exist yet)
  const { data: tailoredResume } = await (supabase
    .from('tailored_resumes') as any)
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', user.id)
    .single();

  return (
    <TailoringReview
      job={job}
      originalResume={profile?.resume_data || null}
      initialTailoredResume={tailoredResume || null}
      userId={user.id}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { ResumeUpload } from '@/components/resume/resume-upload';
import { ResumeList } from '@/components/resume/resume-list';

export default async function ResumePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: resumes } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
        <p className="text-gray-500">Upload and manage your resumes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Upload New Resume</h2>
          <ResumeUpload />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Your Resumes</h2>
          <ResumeList resumes={resumes || []} />
        </div>
      </div>
    </div>
  );
}

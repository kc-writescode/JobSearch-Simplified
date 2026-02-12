'use client';

import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/components/dashboard/profile-card';
import { ResumesSection } from '@/components/dashboard/resumes-section';
import { JobsPipeline } from '@/components/dashboard/jobs-pipeline';

interface ProfileData {
  full_name: string | null;
  email: string;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
}

interface Resume {
  id: string;
  file_name: string;
  file_path: string;
  job_role: string | null;
  title: string | null;
  created_at: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  is_default?: boolean;
}

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  job_url?: string | null;
  location?: string | null;
  description?: string | null;
  resume_id?: string | null;
  tailored_status?: string | null;
  cover_letter?: string | null;
  submission_proof?: string | null;
  applied_at?: string | null;
  created_at: string;
}

interface UnifiedDashboardProps {
  profile: ProfileData;
  resumes: Resume[];
  initialJobs: Job[];
}

export function UnifiedDashboard({ profile, resumes, initialJobs }: UnifiedDashboardProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your profile, resumes, and job applications
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Top row: Profile + Resumes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <ProfileCard profile={profile} onUpdate={handleRefresh} />
          </div>
          <div className="lg:col-span-2">
            <ResumesSection resumes={resumes} onUpdate={handleRefresh} />
          </div>
        </div>

        {/* Jobs Pipeline */}
        <JobsPipeline
          initialJobs={initialJobs}
          resumes={resumes.map(r => ({
            id: r.id,
            job_role: r.job_role,
            title: r.title,
            file_name: r.file_name,
            file_path: r.file_path,
          }))}
          onUpdate={handleRefresh}
        />
      </div>

      {/* Quick tips */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 text-sm">Quick Tips</h4>
          <ul className="mt-2 text-sm text-blue-700 space-y-1">
            <li>1. Upload resumes for different job roles (e.g., "Software Engineer", "Frontend Developer")</li>
            <li>2. Add jobs with the matching resume selected</li>
            <li>3. Click "Tailor" to let AI customize your resume for each specific job</li>
            <li>4. Track your applications through the pipeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

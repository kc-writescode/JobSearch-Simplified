'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PersonalDetailsForm } from '@/components/dashboard/personal-details-form';
import { ResumesSection } from '@/components/dashboard/resumes-section';
import { JobsPipeline } from '@/components/dashboard/jobs-pipeline';
import { VaultSection } from '@/components/dashboard/vault-section';
import { cn } from '@/lib/utils/cn';

interface FeatureAccess {
  cover_letter_enabled: boolean;
  resume_tailor_enabled: boolean;
  custom_resume_enabled: boolean;
}

interface ResumeSkill {
  category: string;
  items: string[];
}

interface ProfileData {
  full_name: string | null;
  email: string;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  personal_details?: any;
  certifications?: any[];
  global_notes?: string;
  feature_access?: FeatureAccess;
  credits?: number;
  resume_skills?: ResumeSkill[];
}

interface Resume {
  id: string;
  file_name: string;
  file_path: string;
  job_role: string | null;
  title: string | null;
  created_at: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
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
  client_notes?: string | null;
  cannot_apply_reason?: string | null;
  created_at: string;
}

interface ClientDashboardProps {
  profile: ProfileData;
  resumes: Resume[];
  initialJobs?: Job[];
}

export function ClientDashboard({ profile, resumes, initialJobs }: ClientDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'resumes' | 'jobs' | 'vault'>('profile');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const QUOTES = [
    "Consistency breeds success.",
    "Your dream job is just around the corner.",
    "Every 'no' brings you closer to a 'yes'.",
    "Small progress is still progress.",
    "Stay focused, stay positive.",
    "You are building your future today.",
    "Resilience is your superpower.",
    "Trust the timing of your life.",
    "The only way to do great work is to love what you do."
  ];

  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Toggle Hub */}
      <div className="lg:hidden fixed top-6 right-6 z-[60]">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-14 w-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-transform active:scale-90"
        >
          {isMenuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Navigation & Identity Sidebar */}
          <aside className={cn(
            "lg:w-64 flex-shrink-0 lg:block transition-all duration-500",
            isMenuOpen ? "fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-xl p-8 block" : "hidden"
          )}>
            <div className="lg:sticky lg:top-10 space-y-8 h-full">
              {/* Identity Section */}
              <div className="px-4 py-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-500/20">
                    {profile.full_name?.[0] || profile.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900 truncate">
                      {profile.full_name?.split(' ')[0] || 'Member'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-100 transition-all active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Sign Out
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Menu</p>
                <button
                  onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                    activeTab === 'profile'
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100"
                  )}
                >
                  <span className="text-base">👤</span>
                  Profile Details
                </button>
                <button
                  onClick={() => { setActiveTab('resumes'); setIsMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                    activeTab === 'resumes'
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100"
                  )}
                >
                  <span className="text-base">📄</span>
                  Resumes
                </button>
                <button
                  onClick={() => { setActiveTab('jobs'); setIsMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                    activeTab === 'jobs'
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100"
                  )}
                >
                  <span className="text-base">💼</span>
                  Job List
                </button>
                <button
                  onClick={() => { setActiveTab('vault'); setIsMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
                    activeTab === 'vault'
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100"
                  )}
                >
                  <span className="text-base">🔐</span>
                  Vault & Notes
                </button>
              </nav>

              {/* Quick Info Box */}
              <div className="p-5 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group hidden lg:block">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 relative z-10">ResumeToJobs (RTJ)</p>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed relative z-10 uppercase tracking-tighter">Your career assistant is active.</p>
              </div>

              <div className="mt-4 text-[9px] font-bold text-slate-300 text-center uppercase tracking-widest">
                Developed by KC-codes
              </div>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
            {/* Welcome Greeting Header - Conditionally Rendered */}
            {activeTab === 'profile' && (
              <header className="mb-6 px-2 lg:px-0">
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Welcome back, {profile.full_name?.split(' ')[0] || 'Member'} 👋
                </h1>
                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest bg-blue-50/50 inline-block px-3 py-1 rounded-lg border border-blue-100/50">
                  Remember: <span className="text-blue-600 italic transition-all duration-500">{quote}</span>
                </p>
              </header>
            )}
            {activeTab === 'profile' && (
              <PersonalDetailsForm
                initialData={profile.personal_details}
                initialResumeSkills={profile.resume_skills}
                onUpdate={handleRefresh}
              />
            )}

            {activeTab === 'resumes' && (
              <ResumesSection resumes={resumes} onUpdate={handleRefresh} />
            )}

            {activeTab === 'jobs' && (
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
                credits={profile.credits}
                featureAccess={profile.feature_access}
              />
            )}

            {activeTab === 'vault' && (
              <VaultSection
                initialCertifications={profile.certifications}
                initialNotes={profile.global_notes}
                onUpdate={handleRefresh}
              />
            )}
          </main>
        </div>
      </div >
    </div >
  );
}


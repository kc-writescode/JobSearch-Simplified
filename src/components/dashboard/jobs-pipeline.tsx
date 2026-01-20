'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JobImportForm } from '@/components/jobs/job-import-form';
import { BulkJobImport } from '@/components/jobs/bulk-job-import';
import { Trash2, FileText, CheckSquare, Square, X, RotateCcw, UserPlus } from 'lucide-react';

type TabType = 'saved' | 'applying' | 'applied' | 'trashed';

// Generate a unique delegated job ID (format: JOB-XXXXXX)
function generateDelegatedJobId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'JOB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface Resume {
  id: string;
  job_role: string | null;
  title: string | null;
  file_name: string;
  file_path: string;
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

interface JobsPipelineProps {
  jobs: Job[];
  resumes: Resume[];
  onUpdate?: () => void;
}

export function JobsPipeline({ jobs, resumes, onUpdate }: JobsPipelineProps) {
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [prefilledUrl, setPrefilledUrl] = useState('');
  const [autoSubmitImport, setAutoSubmitImport] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    job_url: '',
    location: '',
    resume_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    setSelectedJobIds([]);
  }, [activeTab]);

  // Filter jobs by tab
  const savedJobs = jobs.filter(job =>
    job.status === 'saved' || job.status === 'tailored' || job.status === 'tailoring'
  );
  const applyingJobs = jobs.filter(job =>
    job.status === 'delegate_to_va'
  );
  const appliedJobs = jobs.filter(job =>
    job.status === 'applied' || job.status === 'interviewing' || job.status === 'offer'
  );
  const trashedJobs = jobs.filter(job => job.status === 'trashed');

  const getJobsForTab = () => {
    switch (activeTab) {
      case 'saved': return savedJobs;
      case 'applying': return applyingJobs;
      case 'applied': return appliedJobs;
      case 'trashed': return trashedJobs;
    }
  };

  const getResumeName = (resumeId: string | null | undefined) => {
    if (!resumeId) return null;
    const resume = resumes.find(r => r.id === resumeId);
    return resume?.job_role || resume?.title || resume?.file_name || null;
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase.from('jobs') as any).insert({
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        description: formData.description || null,
        job_url: formData.job_url || null,
        location: formData.location || null,
        resume_id: formData.resume_id || null,
        status: 'saved',
      });

      if (error) throw error;

      setFormData({ title: '', company: '', description: '', job_url: '', location: '', resume_id: '' });
      setShowAddForm(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error adding job:', error);
      alert('Failed to add job');
    } finally {
      setSaving(false);
    }
  };

  const handleTrashJob = async (jobId: string) => {
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'trashed', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;
      setSelectedJob(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error trashing job:', error);
    }
  };

  const handleUntrashJob = async (jobId: string) => {
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'saved', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error untrashing job:', error);
    }
  };

  const handleMarkApplied = async (jobId: string) => {
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;
      setSelectedJob(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error marking applied:', error);
    }
  };

  const activeJobsList = getJobsForTab();

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.length === activeJobsList.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(activeJobsList.map(j => j.id));
    }
  };

  const handleBulkTrash = async () => {
    if (selectedJobIds.length === 0) return;
    if (!confirm(`Move ${selectedJobIds.length} tasks to trash?`)) return;

    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'trashed', updated_at: new Date().toISOString() })
        .in('id', selectedJobIds);

      if (error) throw error;
      setSelectedJobIds([]);
      onUpdate?.();
    } catch (error) {
      console.error('Bulk trash error', error);
      alert('Failed to trash items');
    }
  };

  const handleBulkResumeChange = async (resumeId: string) => {
    if (!resumeId || selectedJobIds.length === 0) return;
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ resume_id: resumeId, updated_at: new Date().toISOString() })
        .in('id', selectedJobIds);

      if (error) throw error;
      setSelectedJobIds([]);
      onUpdate?.();
      alert('Resumes updated!');
    } catch (error) {
      console.error('Bulk resume error', error);
      alert('Failed to update resumes');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedJobIds.length === 0) return;
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'saved', updated_at: new Date().toISOString() })
        .in('id', selectedJobIds);

      if (error) throw error;
      setSelectedJobIds([]);
      onUpdate?.();
    } catch (error) {
      console.error('Bulk restore error', error);
    }
  };

  const handleBulkDelegate = async () => {
    if (selectedJobIds.length === 0) return;
    try {
      // Generate unique job IDs and update each job
      const updates = selectedJobIds.map(async (jobId) => {
        const delegatedJobId = generateDelegatedJobId();
        return (supabase.from('jobs') as any)
          .update({
            status: 'delegate_to_va',
            delegated_job_id: delegatedJobId,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      });

      const results = await Promise.all(updates);
      const hasError = results.some((r: any) => r.error);
      if (hasError) throw new Error('Some jobs failed to delegate');

      setSelectedJobIds([]);
      onUpdate?.();
    } catch (error) {
      console.error('Bulk delegate error', error);
    }
  };

  const tabCounts = {
    saved: savedJobs.length,
    applying: applyingJobs.length,
    applied: appliedJobs.length,
    trashed: trashedJobs.length,
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Quick Delegate Mission Control */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -ml-24 -mb-24 transition-transform group-hover:scale-110 duration-1000"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <LinkImportIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Quick Deployment</h3>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Paste URL to delegate application</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group/input">
              <input
                type="url"
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = e.currentTarget.value;
                    if (url) {
                      setPrefilledUrl(url);
                      setAutoSubmitImport(true);
                      setShowImportForm(true);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/10 uppercase tracking-tighter">Enter to Delegate</span>
              </div>
            </div>
            <button
              onClick={() => {
                const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                if (input?.value) {
                  setPrefilledUrl(input.value);
                  setAutoSubmitImport(true);
                  setShowImportForm(true);
                  input.value = '';
                } else {
                  setPrefilledUrl('');
                  setAutoSubmitImport(false);
                  setShowImportForm(true);
                }
              }}
              className="px-8 py-4 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <BriefcaseIcon className="h-4 w-4" />
              Delegate Task
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20">
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider leading-none mb-1.5">Total Tracked</span>
            <span className="text-2xl font-bold text-slate-900 leading-none">{jobs.length}</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-100 hidden sm:block"></div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Job Applications</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Track and manage your application progress</p>
          </div>
        </div>
        {!showAddForm && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 text-white text-[13px] font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Bulk Import
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white text-[13px] font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
            >
              <PlusIcon className="h-4 w-4" />
              Add New Job
            </button>
          </div>
        )}
      </div>

      {/* Modern Mission Addition Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl shadow-blue-50/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <PlusIcon className="h-5 w-5" />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Job Details</h4>
          </div>

          <form onSubmit={handleAddJob} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Software Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Company *</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location / HQ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <MapPinIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Remote / San Francisco"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Job Link</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <ExternalLinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://company.com/careers/role"
                    value={formData.job_url}
                    onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resume to Use</label>
              <select
                value={formData.resume_id}
                onChange={(e) => setFormData({ ...formData, resume_id: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select a resume --</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.job_role || resume.title || resume.file_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Description</label>
              <textarea
                placeholder="Paste the job description for automated tailoring..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !formData.title || !formData.company}
                className="flex-1 py-4 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <BriefcaseIcon className="h-4 w-4" />}
                {saving ? 'Adding Job...' : 'Add Job to List'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-8 py-4 bg-slate-100 text-slate-600 text-sm font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Strategic Tab Navigation */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[1.25rem] border border-slate-200/60 max-w-2xl shadow-inner overflow-x-auto">
        {(['saved', 'applying', 'applied', 'trashed'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 text-[12px] font-bold tracking-tight rounded-[1rem] transition-all duration-300 ${activeTab === tab
              ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 border border-slate-100 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-lg text-[10px] font-bold ${activeTab === tab
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
              : 'bg-slate-200 text-slate-500'
              }`}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedJobIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-slate-700">
          <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2">
            <span className="bg-blue-600 text-white h-5 w-5 rounded flex items-center justify-center text-[10px]">{selectedJobIds.length}</span>
            Selected
          </div>

          <div className="h-8 w-[1px] bg-slate-700 mx-1"></div>

          {activeTab === 'trashed' ? (
            <>
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200 rounded-xl transition-colors font-bold text-xs"
                title="Restore Selected"
              >
                <RotateCcw className="h-4 w-4" />
                Restore
              </button>
              <button
                onClick={handleBulkDelegate}
                className="flex items-center gap-2 px-3 py-2 hover:bg-purple-500/20 text-purple-400 hover:text-purple-200 rounded-xl transition-colors font-bold text-xs"
                title="Delegate Selected"
              >
                <UserPlus className="h-4 w-4" />
                Delegate
              </button>
            </>
          ) : (
            <>
              <select
                className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 max-w-[150px]"
                onChange={(e) => {
                  if (e.target.value) handleBulkResumeChange(e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Change Resume...</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.job_role || r.file_name}</option>
                ))}
              </select>

              <button
                onClick={handleBulkTrash}
                className="p-2.5 hover:bg-red-500/20 text-red-400 hover:text-red-200 rounded-xl transition-colors border border-transparent hover:border-red-500/30"
                title="Move to Trash"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}

          {activeTab === 'saved' && (
            <button
              onClick={handleBulkDelegate}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-500/20 text-purple-400 hover:text-purple-200 rounded-xl transition-colors font-bold text-xs border border-transparent hover:border-purple-500/30"
              title="Delegate Selected to VA"
            >
              <UserPlus className="h-4 w-4" />
              Delegate
            </button>
          )}

          <div className="h-8 w-[1px] bg-slate-700 mx-1"></div>

          <button
            onClick={() => setSelectedJobIds([])}
            className="p-2.5 hover:bg-slate-800 text-slate-400 rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selection Header (only visible when items exist and NOT applied tab) */}
      {activeJobsList.length > 0 && activeTab !== 'applied' && (
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleSelectAll}
            className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            {selectedJobIds.length === activeJobsList.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            Select All {activeJobsList.length} Tasks
          </button>
        </div>
      )}

      {/* Mission Intelligence List */}
      <div className="space-y-4">
        {getJobsForTab().length === 0 ? (
          <div className="py-24 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              <RadarIcon className="h-12 w-12 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-900 italic">No Jobs Found</p>
            <p className="text-sm text-slate-500 mt-2 max-w-xs px-6">Your job list is clear. Add a new job to start your applications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {getJobsForTab().map((job) => (
              <JobRow
                key={job.id}
                job={job}
                tab={activeTab}
                resumeName={getResumeName(job.resume_id)}
                onClick={() => setSelectedJob(job)}
                onUntrash={() => handleUntrashJob(job.id)}
                selected={selectedJobIds.includes(job.id)}
                onSelect={(e) => { e.stopPropagation(); toggleSelectJob(job.id); }}
                showSelection={activeTab !== 'applied'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          tab={activeTab}
          resumeName={getResumeName(selectedJob.resume_id)}
          resumes={resumes}
          onClose={() => setSelectedJob(null)}
          onTrash={() => handleTrashJob(selectedJob.id)}
          onMarkApplied={() => handleMarkApplied(selectedJob.id)}
          onUpdate={onUpdate}
        />
      )}

      {/* Job Import Modal */}
      <JobImportForm
        open={showImportForm}
        initialUrl={prefilledUrl}
        autoSubmit={autoSubmitImport}
        onClose={() => {
          setShowImportForm(false);
          setPrefilledUrl('');
          setAutoSubmitImport(false);
        }}
        onSuccess={() => {
          onUpdate?.();
        }}
      />

      {/* Bulk Job Import Modal */}
      <BulkJobImport
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          onUpdate?.();
        }}
      />
    </div>
  );
}

interface JobRowProps {
  job: Job;
  tab: TabType;
  resumeName: string | null;
  onClick: () => void;
  onUntrash: () => void;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  showSelection?: boolean;
}

function JobRow({ job, tab, resumeName, onClick, onUntrash, selected, onSelect, showSelection = true }: JobRowProps) {
  const getStatusBadge = () => {
    if (job.status === 'delegate_to_va') {
      return <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border border-purple-100"><div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div> Delegated to VA</span>;
    }
    return null;
  };

  const getTailoredBadge = () => {
    switch (job.tailored_status) {
      case 'completed':
        return <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border border-emerald-100"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Tailored</span>;
      case 'processing':
        return <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border border-amber-100"><div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div> Processing</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className="group bg-white p-6 rounded-[1.75rem] border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex items-center gap-6 cursor-pointer relative overflow-hidden"
      onClick={tab !== 'trashed' ? onClick : undefined}
    >
      {showSelection && (
        <div
          className="shrink-0 pl-1 pr-2"
          onClick={onSelect}
        >
          {selected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-slate-200 hover:text-slate-400" />}
        </div>
      )}

      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0 overflow-hidden relative">
        <BuildingIcon className="h-6 w-6 relative z-10" />
        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <h4 className="text-base font-black text-slate-900 tracking-tight truncate leading-tight group-hover:text-blue-600 transition-colors">
              {job.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-slate-500">{job.company}</span>
              {job.location && <span className="text-slate-300 text-xs">•</span>}
              {job.location && <span className="text-xs text-slate-400 font-medium">{job.location}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-2">
            {getStatusBadge()}
            {getTailoredBadge()}
            {/* View Proof button for applied jobs */}
            {tab === 'applied' && job.submission_proof && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const proof = job.submission_proof!;
                  const isUrl = proof.startsWith('http');
                  const url = isUrl ? proof : `/api/resume/view?path=${encodeURIComponent(proof)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <EyeIcon className="h-3 w-3" />
                View Proof
              </button>
            )}
            <div className="flex items-center gap-2">
              {resumeName && <span className="text-[10px] font-black uppercase text-blue-500/70 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50">{resumeName}</span>}
              <span className="text-xs font-black text-slate-900/40 tracking-tighter">
                {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full border border-slate-100 group-hover:bg-slate-50 transition-all">
        {tab === 'trashed' ? (
          <button onClick={(e) => { e.stopPropagation(); onUntrash(); }} className="p-2 text-blue-600 hover:scale-110 transition-transform"><RefreshIcon className="h-5 w-5" /></button>
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-slate-300 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
  );
}

interface JobDetailModalProps {
  job: Job;
  tab: TabType;
  resumeName: string | null;
  resumes: Resume[];
  onClose: () => void;
  onTrash: () => void;
  onMarkApplied: () => void;
  onUpdate?: () => void;
}

function JobDetailModal({ job, tab, resumeName, resumes, onClose, onTrash, onMarkApplied, onUpdate }: JobDetailModalProps) {
  const [isTailoring, setIsTailoring] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tailoredStatus, setTailoredStatus] = useState(job.tailored_status);
  const [coverLetter, setCoverLetter] = useState(job.cover_letter);
  const [matchAnalytics, setMatchAnalytics] = useState<{ score: number; matched_keywords: string[]; missing_keywords: string[] } | null>(null);
  const [editableTailoredData, setEditableTailoredData] = useState<{
    summary: string;
    experience: any[];
    skills: string[];
  } | null>(null);
  const [isSavingTweaks, setIsSavingTweaks] = useState(false);
  const [copiedCL, setCopiedCL] = useState(false);

  // Initial fetch of tailored data
  useEffect(() => {
    if (tailoredStatus === 'completed') {
      handleRefreshStatus();
    }
  }, []);

  const getStatusBadge = () => {
    switch (tailoredStatus) {
      case 'completed': return <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Tailored</span>;
      case 'processing': return <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-widest"><div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div> Processing...</span>;
      default: return <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest"><div className="h-2 w-2 rounded-full bg-slate-300"></div> Pending</span>;
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/tailor?job_id=${job.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.status) {
          setTailoredStatus(data.data.status);
          if (data.data.status === 'completed') {
            onUpdate?.();
            if (data.data.full_tailored_data) {
              setMatchAnalytics({
                score: data.data.full_tailored_data.match_score || 0,
                matched_keywords: data.data.full_tailored_data.keywords_matched || [],
                missing_keywords: data.data.full_tailored_data.keywords_missing || [],
              });
              setEditableTailoredData({
                summary: data.data.full_tailored_data.summary || '',
                experience: data.data.full_tailored_data.experience || [],
                skills: data.data.full_tailored_data.highlighted_skills || data.data.full_tailored_data.skills || [],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTailorResume = async () => {
    if (!job.resume_id) {
      alert('Select a resume to enable tailoring.');
      return;
    }
    setIsTailoring(true);
    setTailoredStatus('processing');
    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, mode: 'direct' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sequence failure');
      setTailoredStatus(data.data?.status || 'processing');
      if (data.data?.status === 'completed' && data.data?.tailored) {
        setMatchAnalytics({
          score: data.data.tailored.match_score || 0,
          matched_keywords: data.data.tailored.keywords_matched || [],
          missing_keywords: data.data.tailored.keywords_missing || [],
        });
        setEditableTailoredData({
          summary: data.data.tailored.summary || '',
          experience: data.data.tailored.experience || [],
          skills: data.data.tailored.highlighted_skills || data.data.tailored.skills || [],
        });
      }
      onUpdate?.();
    } catch (error) {
      console.error('Error tailoring:', error);
      setTailoredStatus(null);
      alert(error instanceof Error ? error.message : 'System Failure');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!job.description) {
      alert('Job description is required.');
      return;
    }
    setIsGeneratingCL(true);
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      });
      if (!response.ok) throw new Error('Generation Error');
      const result = await response.json();
      setCoverLetter(result.cover_letter);
      onUpdate?.();
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('CL Synthesis Failed');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleViewTailoredResume = () => window.open(`/tailor/${job.id}`, '_blank');

  const handleDownloadTailoredResume = async () => {
    try {
      const response = await fetch(`/api/tailor/download?job_id=${job.id}`);
      if (!response.ok) throw new Error('Download conflict');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_${job.company}_${job.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Operation Failed');
    }
  };

  const handleDownloadOriginalResume = async () => {
    if (!job.resume_id) return;
    const resume = resumes.find(r => r.id === job.resume_id);
    if (!resume?.file_path) {
      alert('Original resume file not found');
      return;
    }

    try {
      const response = await fetch(`/api/resume/download?path=${encodeURIComponent(resume.file_path)}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name || 'resume.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download original resume');
    }
  };
  const handleSaveTweaks = async () => {
    if (!editableTailoredData) return;
    setIsSavingTweaks(true);
    try {
      const response = await fetch('/api/tailor/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          tailored_summary: editableTailoredData.summary,
          tailored_experience: editableTailoredData.experience,
          tailored_skills: editableTailoredData.skills,
        }),
      });

      if (!response.ok) throw new Error('Failed to save tweaks');
      onUpdate?.();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving tweaks:', error);
      alert('Failed to save changes');
    } finally {
      setIsSavingTweaks(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopiedCL(true);
    setTimeout(() => setCopiedCL(false), 2000);
  };

  const handleDownloadCoverLetter = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch(`/api/cover-letter/download?job_id=${job.id}&format=${format}`);
      if (!response.ok) throw new Error('Download conflict');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${job.company}.${format === 'docx' ? 'docx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Operation Failed');
    }
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newValue: string) => {
    if (!editableTailoredData) return;
    const newExperience = [...editableTailoredData.experience];
    const newBullets = [...(newExperience[expIndex].tailored_bullets || [])];
    newBullets[bulletIndex] = newValue;
    newExperience[expIndex] = { ...newExperience[expIndex], tailored_bullets: newBullets };
    setEditableTailoredData({ ...editableTailoredData, experience: newExperience });
  };

  const updateExperienceField = (expIndex: number, field: string, newValue: string) => {
    if (!editableTailoredData) return;
    const newExperience = [...editableTailoredData.experience];
    newExperience[expIndex] = { ...newExperience[expIndex], [field]: newValue };
    setEditableTailoredData({ ...editableTailoredData, experience: newExperience });
  };

  const updateSkillsStr = (newSkillsStr: string) => {
    if (!editableTailoredData) return;
    const skills = newSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
    setEditableTailoredData({ ...editableTailoredData, skills });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] relative border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <BuildingIcon className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tighter">{job.title}</h2>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{job.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">Status</span>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-slate-900 capitalize italic">{tab}</span>
                {getStatusBadge()}
              </div>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">Added On</span>
              <span className="text-[13px] font-black text-slate-900 italic">
                {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Submission Evidence (Applied Only) - Moved to top */}
          {tab === 'applied' && job.submission_proof && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <div className="h-1 w-4 bg-emerald-500 rounded-full"></div>
                Submission Evidence
              </h3>
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><PdfIcon className="h-4 w-4" /></div>
                    <span className="text-sm font-black text-slate-900 tracking-tight italic">Deployment Screenshot PDF</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Verified</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const proof = job.submission_proof!;
                      const isUrl = proof.startsWith('http');
                      const url = isUrl ? proof : `/api/resume/view?path=${encodeURIComponent(proof)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Preview Evidence
                  </button>
                  <a
                    href={job.submission_proof!.startsWith('http') ? job.submission_proof! : `/api/resume/view?path=${encodeURIComponent(job.submission_proof!)}`}
                    onClick={(e) => {
                      if (!job.submission_proof!.startsWith('http')) {
                        e.preventDefault();
                        const url = `/api/resume/download?path=${encodeURIComponent(job.submission_proof!)}`;
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Submission_${job.company}.pdf`;
                        a.click();
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black text-center uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Deployment Kit */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <div className="h-1 w-4 bg-blue-500 rounded-full"></div>
              Job Application Kit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Resume Section */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-white transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileTextIcon className="h-4 w-4" /></div>
                  <span className="text-sm font-black text-slate-900 tracking-tight italic">Master Resume</span>
                </div>
                <button
                  onClick={handleDownloadOriginalResume}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <RadarIcon className="h-3 w-3" /> Download Original
                </button>
              </div>

              {/* Tailored Section */}
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><PdfIcon className="h-4 w-4" /></div>
                    <span className="text-sm font-black text-slate-900 tracking-tight italic">Tailored Resume</span>
                  </div>
                  {tailoredStatus === 'completed' && <span className="text-[10px] font-black text-emerald-600 uppercase">Ready</span>}
                </div>
                {tailoredStatus === 'completed' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button onClick={handleViewTailoredResume} className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200">Review</button>
                      <button onClick={handleDownloadTailoredResume} className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700">Download PDF</button>
                    </div>

                    {/* Match Analytics View */}
                    {matchAnalytics && (
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Match Analytics</h4>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${matchAnalytics.score > 80 ? 'bg-emerald-500' : matchAnalytics.score > 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                            <span className="text-lg font-black text-slate-900">{matchAnalytics.score}% Score</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Keyword Matches</p>
                            <div className="flex flex-wrap gap-1">
                              {matchAnalytics.matched_keywords.length > 0 ? (
                                matchAnalytics.matched_keywords.slice(0, 6).map((kw, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">{kw}</span>
                                ))
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">No matches</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-tight">Keyword Gaps</p>
                            <div className="flex flex-wrap gap-1">
                              {matchAnalytics.missing_keywords.length > 0 ? (
                                matchAnalytics.missing_keywords.slice(0, 6).map((kw, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded border border-red-100">{kw}</span>
                                ))
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">No gaps</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Tweak Mode for User */}
                    {editableTailoredData && (
                      <div className="bg-white border-2 border-blue-100 rounded-[2rem] p-6 shadow-xl shadow-blue-50/50 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                            <FileTextIcon className="h-3 w-3" />
                            Refine Your Resume
                          </h4>
                          <button
                            onClick={handleSaveTweaks}
                            disabled={isSavingTweaks}
                            className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                          >
                            {isSavingTweaks ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Professional Summary</label>
                            <textarea
                              value={editableTailoredData.summary}
                              onChange={(e) => setEditableTailoredData({ ...editableTailoredData, summary: e.target.value })}
                              className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Key Skills (Comma Separated)</label>
                            <textarea
                              value={(editableTailoredData.skills || []).join(', ')}
                              onChange={(e) => updateSkillsStr(e.target.value)}
                              className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[60px]"
                            />
                          </div>

                          <div className="space-y-4 pt-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Experience History</p>
                            {editableTailoredData.experience.slice(0, 3).map((exp, expIdx) => (
                              <div key={expIdx} className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                                    placeholder="Company"
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold"
                                  />
                                  <input
                                    type="text"
                                    value={exp.role || exp.title}
                                    onChange={(e) => updateExperienceField(expIdx, exp.role ? 'role' : 'title', e.target.value)}
                                    placeholder="Role"
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold"
                                  />
                                  <input
                                    type="text"
                                    value={exp.startDate || exp.start_date}
                                    onChange={(e) => updateExperienceField(expIdx, exp.startDate ? 'startDate' : 'start_date', e.target.value)}
                                    placeholder="Start Date"
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold"
                                  />
                                  <input
                                    type="text"
                                    value={exp.endDate || exp.end_date}
                                    onChange={(e) => updateExperienceField(expIdx, exp.endDate ? 'endDate' : 'end_date', e.target.value)}
                                    placeholder="End Date"
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold"
                                  />
                                </div>
                                <div className="space-y-2">
                                  {exp.tailored_bullets?.map((bullet: string, bIdx: number) => (
                                    <div key={bIdx} className="flex gap-2">
                                      <span className="text-slate-300 mt-2 text-xs font-black">•</span>
                                      <textarea
                                        value={bullet}
                                        onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-50 resize-none min-h-[50px]"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleTailorResume} disabled={isTailoring} className="w-full py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50">
                    {isTailoring ? 'Processing...' : 'Generate Tailored Resume'}
                  </button>
                )}
              </div>

              {/* Cover Letter Section */}
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileTextIcon className="h-4 w-4" /></div>
                    <span className="text-sm font-black text-slate-900 tracking-tight italic">Cover Letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coverLetter && (
                      <button
                        onClick={handleCopyCoverLetter}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${copiedCL ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                      >
                        {copiedCL ? 'Copied!' : 'Copy Text'}
                      </button>
                    )}
                    {coverLetter && <span className="text-[10px] font-black text-blue-600 uppercase">Generated</span>}
                  </div>
                </div>
                {coverLetter ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 max-h-32 overflow-y-auto scrollbar-hide">
                      <p className="text-[13px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{coverLetter}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDownloadCoverLetter('pdf')} className="flex-1 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-100 flex items-center justify-center gap-2">
                        <PdfIcon className="h-3 w-3" /> PDF
                      </button>
                      <button onClick={() => handleDownloadCoverLetter('docx')} className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                        <FileWordIcon className="h-3 w-3" /> Word
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleGenerateCoverLetter} disabled={isGeneratingCL} className="w-full py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50">
                    {isGeneratingCL ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mission Coordinates */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <div className="h-1 w-4 bg-amber-500 rounded-full"></div>
              Job Information
            </h3>
            {job.job_url && (
              <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group/link hover:bg-white hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover/link:text-blue-500 transition-colors"><ExternalLinkIcon className="h-4 w-4" /></div>
                  <span className="text-sm font-black text-slate-900 group-hover/link:text-blue-600 transition-colors italic">View Job Posting</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover/link:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          {tab === 'applying' && (
            <>
              <button onClick={onMarkApplied} className="flex-1 py-4 bg-emerald-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98]">Mark as Applied</button>
              <button onClick={onTrash} className="px-6 py-4 bg-white border border-red-100 text-red-500 hover:bg-red-50 text-sm font-black uppercase tracking-widest rounded-2xl transition-all">Remove</button>
            </>
          )}
          {tab === 'applied' && (
            <button onClick={onClose} className="w-full py-4 bg-white border border-slate-200 text-slate-700 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tactical Icons
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>;
}
function BriefcaseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
}
function BuildingIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
}
function MapPinIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
}
function ExternalLinkIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>;
}
function RadarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>;
}
function RefreshIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>;
}
function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
}
function FileTextIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
}
function PdfIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
}
function FileWordIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m4 0h4"></path></svg>;
}
function LinkImportIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>;
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
}

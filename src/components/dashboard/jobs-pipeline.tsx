'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { JobImportForm } from '@/components/jobs/job-import-form';
import { BulkJobImport } from '@/components/jobs/bulk-job-import';
import { Trash2, FileText, CheckSquare, Square, X, RotateCcw, UserPlus, Tag, Plus, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ban, RefreshCw } from 'lucide-react';
import { PRESET_LABELS, getLabelClasses } from '@/lib/constants/labels';
import { jsPDF } from 'jspdf';

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
  delegated_job_id?: string | null;
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
  custom_resume_proof?: string | null;
  client_notes?: string | null;
  labels?: string[] | null;
  cannot_apply_reason?: string | null;
  created_at: string;
}

interface FeatureAccess {
  cover_letter_enabled: boolean;
  resume_tailor_enabled: boolean;
  custom_resume_enabled: boolean;
}

interface JobsPipelineProps {
  jobs: Job[];
  resumes: Resume[];
  onUpdate?: () => void;
  credits?: number;
  featureAccess?: FeatureAccess;
}

export function JobsPipeline({ jobs, resumes, onUpdate, credits = 0, featureAccess }: JobsPipelineProps) {
  const [activeTab, setActiveTab] = useState<TabType>('applying');
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
  const [selectedLabelFilters, setSelectedLabelFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Fast client-side refresh — only re-fetches jobs instead of full page reload
  const handleRefreshJobs = async () => {
    setRefreshing(true);
    try {
      onUpdate?.();
      toast.success('Job list refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh');
    } finally {
      // Keep spinner for at least 600ms for visual feedback
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    setSelectedJobIds([]);
    setCurrentPage(1);
  }, [activeTab]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLabelFilters]);

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
    let tabJobs: Job[];
    switch (activeTab) {
      case 'saved': tabJobs = savedJobs; break;
      case 'applying': tabJobs = applyingJobs; break;
      case 'applied': tabJobs = appliedJobs; break;
      case 'trashed': tabJobs = trashedJobs; break;
    }
    if (selectedLabelFilters.length > 0) {
      tabJobs = tabJobs.filter(job =>
        job.labels && job.labels.some(l => selectedLabelFilters.includes(l))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tabJobs = tabJobs.filter(job =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.location && job.location.toLowerCase().includes(q))
      );
    }
    return tabJobs;
  };

  // Derive all unique labels across ALL jobs for filter options
  const allLabelsForTab = Array.from(new Set(
    jobs.flatMap(j => j.labels || [])
  ));

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
      toast.error('Failed to add job');
    } finally {
      setSaving(false);
    }
  };

  const handleTrashJob = async (jobId: string) => {
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'trashed', trashed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
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
        .update({ status: 'saved', trashed_at: null, updated_at: new Date().toISOString() })
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

  const allFilteredJobs = getJobsForTab();
  const totalItems = allFilteredJobs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedJobs = allFilteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeJobsList = paginatedJobs;

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.length === allFilteredJobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(allFilteredJobs.map(j => j.id));
    }
  };

  const handleBulkTrash = async () => {
    if (selectedJobIds.length === 0) return;
    if (!confirm(`Move ${selectedJobIds.length} tasks to trash?`)) return;

    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'trashed', trashed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in('id', selectedJobIds);

      if (error) throw error;
      setSelectedJobIds([]);
      onUpdate?.();
    } catch (error) {
      console.error('Bulk trash error', error);
      toast.error('Failed to trash items');
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
      toast.success('Resumes updated!');
    } catch (error) {
      console.error('Bulk resume error', error);
      toast.error('Failed to update resumes');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedJobIds.length === 0) return;
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status: 'saved', trashed_at: null, updated_at: new Date().toISOString() })
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
          <div className={`hidden sm:flex flex-col px-5 py-3 rounded-2xl border-2 shadow-sm ${credits === 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
            credits < 50 ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200' :
              'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200'
            }`}>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider leading-none mb-1">Credits</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{credits === 0 ? '⛔' : credits < 50 ? '⚠️' : '✅'}</span>
              <span className={`text-3xl font-black leading-none ${credits === 0 ? 'text-red-600' : credits < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{credits}</span>
            </div>
            {credits === 0 && <span className="text-[9px] font-bold text-red-500 mt-1">No credits remaining</span>}
            {credits > 0 && credits < 50 && <span className="text-[9px] font-bold text-amber-600 mt-1">Low balance</span>}
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
      <div className="flex items-center gap-2">
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

        {/* Refresh Button */}
        <button
          onClick={handleRefreshJobs}
          disabled={refreshing}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          title="Refresh job list"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Bar + Label Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            placeholder="Filter jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-[12px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 shadow-inner"
          />
        </div>

        {/* Labels Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLabelDropdown(!showLabelDropdown)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-bold border transition-all whitespace-nowrap ${selectedLabelFilters.length > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:text-slate-700'
              }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Labels
            {selectedLabelFilters.length > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{selectedLabelFilters.length}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showLabelDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLabelDropdown(false)} />
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-1.5">
                {selectedLabelFilters.length > 0 && (
                  <button
                    onClick={() => { setSelectedLabelFilters([]); setShowLabelDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-wide"
                  >
                    Clear All
                  </button>
                )}
                {allLabelsForTab.length > 0 ? (
                  allLabelsForTab.map((label) => {
                    const isActive = selectedLabelFilters.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          setSelectedLabelFilters(prev =>
                            isActive ? prev.filter(l => l !== label) : [...prev, label]
                          );
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                      >
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${getLabelClasses(label)}`}>
                          {label}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-blue-600 text-xs font-bold">&#10003;</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-[10px] font-semibold text-slate-400">No labels yet. Add labels from a job detail.</p>
                )}
              </div>
            </>
          )}
        </div>
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
      {allFilteredJobs.length > 0 && activeTab !== 'applied' && (
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleSelectAll}
            className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            {selectedJobIds.length === allFilteredJobs.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            Select All {allFilteredJobs.length}
          </button>
        </div>
      )}

      {/* Mission Intelligence List */}
      <div className="space-y-3">
        {allFilteredJobs.length === 0 ? (
          <div className="py-16 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <RadarIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base font-black text-slate-900">No Jobs Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs px-6">Your job list is clear. Add a new job to start your applications.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {paginatedJobs.map((job) => (
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
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">per page</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 mr-2">
              {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </span>

            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page indicator */}
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-black text-blue-700">
              {currentPage} / {totalPages || 1}
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
          featureAccess={featureAccess}
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
      return <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-purple-100"><div className="h-1 w-1 rounded-full bg-purple-500"></div> VA</span>;
    }
    return null;
  };

  const getTailoredBadge = () => {
    switch (job.tailored_status) {
      case 'completed':
        return <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-emerald-100"><div className="h-1 w-1 rounded-full bg-emerald-500"></div> Tailored</span>;
      case 'processing':
        return <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-amber-100"><div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse"></div> Processing</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className="group bg-white px-4 py-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 flex items-center gap-3 cursor-pointer"
      onClick={onClick}
    >
      {showSelection && (
        <div
          className="shrink-0"
          onClick={onSelect}
        >
          {selected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-300 hover:text-slate-400" />}
        </div>
      )}

      {/* Job ID Badge */}
      {job.delegated_job_id && (
        <span className="shrink-0 text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
          {job.delegated_job_id}
        </span>
      )}

      {/* Company Icon */}
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
        <BuildingIcon className="h-4 w-4" />
      </div>

      {/* Job Title & Company */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {job.title}
        </h4>
        <span className="text-xs text-slate-500">{job.company}</span>
      </div>

      {/* Labels */}
      {job.labels && job.labels.length > 0 && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {job.labels.slice(0, 2).map((label) => (
            <span key={label} className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${getLabelClasses(label)}`}>
              {label}
            </span>
          ))}
          {job.labels.length > 2 && (
            <span className="text-[8px] font-bold text-slate-400">+{job.labels.length - 2}</span>
          )}
        </div>
      )}

      {/* Status Badges */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {getStatusBadge()}
        {getTailoredBadge()}
      </div>

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
          className="shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors"
        >
          <EyeIcon className="h-3 w-3" />
          Proof
        </button>
      )}

      {/* Resume Badge */}
      {resumeName && (
        <span className="hidden lg:inline-block shrink-0 text-[9px] font-bold uppercase text-blue-500/70 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50 max-w-[80px] truncate">
          {resumeName}
        </span>
      )}

      {/* Date */}
      <span className="shrink-0 text-[10px] font-bold text-slate-400">
        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>

      {/* Cannot Apply Reason (Trashed Only) */}
      {tab === 'trashed' && job.cannot_apply_reason && (
        <div className="shrink-0 max-w-[150px] hidden md:block">
          <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100 truncate block group-hover:bg-red-100 transition-all font-mono tracking-tighter" title={job.cannot_apply_reason}>
            {job.cannot_apply_reason}
          </span>
        </div>
      )}

      {/* Action */}
      <div className="shrink-0">
        {tab === 'trashed' ? (
          <button onClick={(e) => { e.stopPropagation(); onUntrash(); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><RefreshIcon className="h-4 w-4" /></button>
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
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
  featureAccess?: FeatureAccess;
}

function JobDetailModal({ job, tab, resumeName, resumes, onClose, onTrash, onMarkApplied, onUpdate, featureAccess }: JobDetailModalProps) {
  const supabase = createClient();
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
  const [localClientNotes, setLocalClientNotes] = useState(job.client_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [localLabels, setLocalLabels] = useState<string[]>(job.labels || []);
  const [customLabelInput, setCustomLabelInput] = useState('');
  const [isSavingLabels, setIsSavingLabels] = useState(false);

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
      toast.warning('Select a resume to enable tailoring.');
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
      toast.error(error instanceof Error ? error.message : 'System Failure');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!job.description) {
      toast.warning('Job description is required.');
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
      toast.error('Cover letter generation failed');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleViewTailoredResume = () => window.open(`/tailor/${job.id}`, '_blank');

  const handleDownloadTailoredResume = async () => {
    try {
      window.open(`/api/resume/download?taskId=${job.id}&type=tailored`, '_blank');
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  const handleDownloadOriginalResume = async () => {
    if (!job.resume_id) return;
    const resume = resumes.find(r => r.id === job.resume_id);
    if (!resume?.file_path) {
      toast.error('Original resume file not found');
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
      toast.error('Failed to download original resume');
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
          cover_letter: coverLetter,
        }),
      });

      if (!response.ok) throw new Error('Failed to save tweaks');
      onUpdate?.();
      toast.success('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving tweaks:', error);
      toast.error('Failed to save changes');
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
    if (!coverLetter) {
      toast.error('No cover letter content to download');
      return;
    }

    const safeCompanyName = job.company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

    if (format === 'pdf') {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const lines = doc.splitTextToSize(coverLetter, maxLineWidth);
        doc.text(lines, margin, 25);

        doc.save(`Cover_Letter_${safeCompanyName}.pdf`);
        toast.success('Cover letter PDF generated!');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate PDF');
      }
    } else {
      const blob = new Blob([coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${safeCompanyName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Cover letter downloaded as .txt');
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

          {/* Job Information — Quick Link */}
          {job.job_url && (
            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl group/link hover:from-blue-100 hover:to-indigo-100 hover:border-blue-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500 group-hover/link:shadow-md transition-shadow"><ExternalLinkIcon className="h-4 w-4" /></div>
                <div>
                  <span className="text-sm font-black text-slate-900 group-hover/link:text-blue-700 transition-colors">View Job Posting</span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate max-w-[280px]">{job.job_url}</span>
                </div>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-blue-300 group-hover/link:translate-x-1 group-hover/link:text-blue-500 transition-all" />
            </a>
          )}

          {/* Labels — Inline Tag Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Tag className="h-3 w-3" />
                Labels
              </h3>
              {JSON.stringify(localLabels) !== JSON.stringify(job.labels || []) && (
                <button
                  onClick={async () => {
                    setIsSavingLabels(true);
                    try {
                      const { error } = await (supabase.from('jobs') as any)
                        .update({ labels: localLabels, updated_at: new Date().toISOString() })
                        .eq('id', job.id);
                      if (error) throw error;
                      toast.success('Labels updated!');
                      onUpdate?.();
                    } catch (e) {
                      toast.error('Failed to save labels');
                    } finally {
                      setIsSavingLabels(false);
                    }
                  }}
                  disabled={isSavingLabels}
                  className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all disabled:opacity-30 shadow-sm"
                >
                  {isSavingLabels ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            {/* Active labels as removable pills */}
            {localLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {localLabels.map((label) => (
                  <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${getLabelClasses(label)}`}>
                    {label}
                    <button
                      onClick={() => setLocalLabels(localLabels.filter(l => l !== label))}
                      className="ml-0.5 hover:opacity-70 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Preset chips + custom input in a single row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_LABELS.filter(p => !localLabels.includes(p.name)).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setLocalLabels([...localLabels, preset.name])}
                  className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border opacity-40 hover:opacity-100 transition-opacity ${getLabelClasses(preset.name)}`}
                >
                  + {preset.name}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="text"
                  value={customLabelInput}
                  onChange={(e) => setCustomLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customLabelInput.trim()) {
                      const trimmed = customLabelInput.trim();
                      if (!localLabels.includes(trimmed)) {
                        setLocalLabels([...localLabels, trimmed]);
                      }
                      setCustomLabelInput('');
                    }
                  }}
                  placeholder="Custom..."
                  className="w-24 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:w-36 transition-all placeholder:text-slate-300"
                />
                {customLabelInput.trim() && (
                  <button
                    onClick={() => {
                      const trimmed = customLabelInput.trim();
                      if (trimmed && !localLabels.includes(trimmed)) {
                        setLocalLabels([...localLabels, trimmed]);
                      }
                      setCustomLabelInput('');
                    }}
                    className="p-1 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Specific Deployment Notes (FOR CLIENT) */}
          {(tab === 'applying' || tab === 'saved') && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                <div className="h-1 w-4 bg-blue-600 rounded-full"></div>
                Job Specific Deployment Notes
              </h3>
              <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-[2rem] space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Add specific instructions for the VA for this application only.</p>
                <textarea
                  value={localClientNotes}
                  onChange={(e) => setLocalClientNotes(e.target.value)}
                  placeholder="e.g. 'Please use my alternative email for this one' or 'Make sure to highlight my React experience above all else'"
                  className="w-full min-h-[100px] p-4 bg-white border border-blue-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300 resize-none"
                />
                <button
                  onClick={async () => {
                    setIsSavingNotes(true);
                    try {
                      const { error } = await (supabase.from('jobs') as any)
                        .update({ client_notes: localClientNotes, updated_at: new Date().toISOString() })
                        .eq('id', job.id);
                      if (error) throw error;
                      toast.success('Notes updated!');
                      onUpdate?.();
                    } catch (e) {
                      toast.error('Failed to save notes');
                    } finally {
                      setIsSavingNotes(false);
                    }
                  }}
                  disabled={isSavingNotes || localClientNotes === (job.client_notes || '')}
                  className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes for VA'}
                </button>
              </div>
            </div>
          )}

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

              {job.custom_resume_proof && (
                <div className="mt-4 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PdfIcon className="h-4 w-4" /></div>
                      <span className="text-sm font-black text-slate-900 tracking-tight italic">Custom Deployment Resume</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase">Custom</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const proof = job.custom_resume_proof!;
                        const url = `/api/resume/view?path=${encodeURIComponent(proof)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 py-3 bg-white border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-all"
                    >
                      Preview Resume
                    </button>
                    <a
                      href={`/api/resume/view?path=${encodeURIComponent(job.custom_resume_proof!)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const url = `/api/resume/download?path=${encodeURIComponent(job.custom_resume_proof!)}`;
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Custom_Resume_${job.company}.pdf`;
                        a.click();
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-blue-600 text-white text-xs font-black text-center uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trashed Info — Cannot Apply Reason */}
          {job.status === 'trashed' && job.cannot_apply_reason && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-red-600">
                <Ban className="h-4 w-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Reason for Rejection</h3>
              </div>
              <p className="text-sm font-bold text-red-900 italic leading-relaxed">"{job.cannot_apply_reason}"</p>
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">This task was marked as 'Cannot Apply' by the recruitment team.</p>
            </div>
          )}

          {/* Deployment Kit */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <div className="h-1 w-4 bg-blue-500 rounded-full"></div>
              Job Application Kit
            </h3>

            <div className={`grid grid-cols-1 ${featureAccess?.resume_tailor_enabled && featureAccess?.cover_letter_enabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3`}>
              {/* Original Resume Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-white transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileTextIcon className="h-3.5 w-3.5" /></div>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter italic">Master Resume</span>
                  </div>
                </div>
                <button
                  onClick={handleDownloadOriginalResume}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <RadarIcon className="h-3 w-3" /> Download
                </button>
              </div>

              {/* Tailored Section */}
              {featureAccess?.resume_tailor_enabled && (
                <div className="p-4 bg-white border border-slate-200 rounded-3xl hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><PdfIcon className="h-3.5 w-3.5" /></div>
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter italic">Tailored Resume</span>
                    </div>
                    {tailoredStatus === 'completed' && <span className="text-[9px] font-black text-emerald-600 uppercase">Ready</span>}
                  </div>
                  {tailoredStatus === 'completed' ? (
                    <div className="flex gap-2">
                      <button onClick={handleViewTailoredResume} className="flex-1 py-2 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200">Review</button>
                      <button onClick={handleDownloadTailoredResume} className="flex-1 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-emerald-700">PDF</button>
                    </div>
                  ) : (
                    <button onClick={handleTailorResume} disabled={isTailoring} className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-blue-50 hover:bg-blue-700 disabled:opacity-50">
                      {isTailoring ? '...' : 'Generate'}
                    </button>
                  )}
                </div>
              )}

              {/* Cover Letter Section */}
              {featureAccess?.cover_letter_enabled && (
                <div className="p-4 bg-white border border-slate-200 rounded-3xl hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><FileTextIcon className="h-3.5 w-3.5" /></div>
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter italic">Cover Letter</span>
                    </div>
                    {coverLetter && <span className="text-[9px] font-black text-blue-600 uppercase">Done</span>}
                  </div>
                  {coverLetter ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleDownloadCoverLetter('pdf')} className="flex-1 py-2 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 shadow-sm flex items-center justify-center gap-1.5">
                        PDF
                      </button>
                      <button onClick={() => handleDownloadCoverLetter('docx')} className="flex-1 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1.5">
                        DOCX
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleGenerateCoverLetter} disabled={isGeneratingCL} className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-blue-50 hover:bg-blue-700 disabled:opacity-50">
                      {isGeneratingCL ? '...' : 'Generate'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Expanded Analytics/Edit Section */}
            {featureAccess?.resume_tailor_enabled && tailoredStatus === 'completed' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {matchAnalytics && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Match Analytics</h4>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${matchAnalytics.score > 80 ? 'bg-emerald-500' : matchAnalytics.score > 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <span className="text-base font-black text-slate-900">{matchAnalytics.score}% Match</span>
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

                {editableTailoredData && (
                  <div className="bg-white border-2 border-blue-50 rounded-3xl p-6 shadow-xl shadow-blue-50/20 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                        <FileTextIcon className="h-3 w-3" />
                        Refine Resume
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
                          className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Cover Letter Content</label>
                          <button
                            onClick={handleCopyCoverLetter}
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${copiedCL ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                          >
                            {copiedCL ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <textarea
                          value={coverLetter || ''}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[120px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

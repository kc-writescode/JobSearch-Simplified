'use client';

import React, { useState } from 'react';
import { VACoreTask, AIStatus, TaskStatus } from '@/types/admin.types';
import { jsPDF } from 'jspdf';
import { Upload, FileText, Check, Eye, Loader2, AlertCircle, ChevronDown, Search, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApplicationWorkspaceProps {
  task: VACoreTask | null;
  onClose: () => void;
  onSubmit: (proofOfWork: { screenshotUrl?: string; submissionLink?: string; proofPath?: string; customResumePath?: string }) => Promise<void>;
  isSubmitting: boolean;
  currentAdminId?: string;
  onClaim?: (task: VACoreTask) => Promise<void>;
}

export function ApplicationWorkspace({
  task,
  onClose,
  onSubmit,
  isSubmitting,
  currentAdminId,
  onClaim,
}: ApplicationWorkspaceProps) {

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploadStatus, setProofUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [proofPath, setProofPath] = useState<string>(task?.proofOfWork?.screenshotUrl || '');

  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const [customResumeUploadStatus, setCustomResumeUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [customResumePath, setCustomResumePath] = useState<string>(task?.proofOfWork?.customResumeUrl || ''); // Reusing screenshotUrl field for storage path if needed, or mapping it.

  const [activeTab, setActiveTab] = useState<'applicant' | 'documents' | 'inputs'>('applicant');

  // AI & Formatting State
  const [isTailoring, setIsTailoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [currentAiStatus, setCurrentAiStatus] = useState<AIStatus>(task?.aiStatus || 'Pending');
  const [currentCoverLetter, setCurrentCoverLetter] = useState<string>(task?.coverLetter || '');
  const [matchAnalytics, setMatchAnalytics] = useState(task?.matchAnalytics || null);
  const [editableTailoredData, setEditableTailoredData] = useState<any>(task?.fullTailoredData || null);
  const [isSavingTweaks, setIsSavingTweaks] = useState(false);
  const [isSavingCLContent, setIsSavingCLContent] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Job Description Dialog State
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [pendingJobDescription, setPendingJobDescription] = useState(task?.profileDetails?.job_description || '');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [descriptionAction, setDescriptionAction] = useState<'tailor' | 'cover_letter' | null>(null);

  // Profile search state
  const [profileSearch, setProfileSearch] = useState('');

  // Sync state with task when it changes
  React.useEffect(() => {
    if (task) {
      // Reset proof-related states when task changes
      setProofFile(null);
      setProofPath(task.proofOfWork?.screenshotUrl || '');
      setProofUploadStatus(task.proofOfWork?.screenshotUrl ? 'success' : 'idle');

      setCustomResumeFile(null);
      setCustomResumePath(task.proofOfWork?.customResumeUrl || '');
      setCustomResumeUploadStatus(task.proofOfWork?.customResumeUrl ? 'success' : 'idle');

      // Sync AI states
      setCurrentAiStatus(task.aiStatus || 'Pending');
      setCurrentCoverLetter(task.coverLetter || '');
      setMatchAnalytics(task.matchAnalytics || null);
      setEditableTailoredData(task.fullTailoredData || null);
      setPendingJobDescription(task.profileDetails?.job_description || '');
    }
  }, [task]);

  if (!task) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRefreshStatus = async () => {
    if (!task) return;
    setIsRefreshing(true);
    try {
      const supabase = createClient();

      // 1. Fetch Job basic info
      const { data: jobData, error: jobError } = await (supabase.from('jobs') as any)
        .select('ai_status, cover_letter')
        .eq('id', task.id)
        .maybeSingle();

      if (jobError) throw jobError;

      // 2. Fetch latest Tailored Resume
      const { data: tailoredData, error: tailoredError } = await (supabase.from('tailored_resumes') as any)
        .select('full_tailored_data, tailored_summary, tailored_experience, tailored_skills')
        .eq('job_id', task.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tailoredError) throw tailoredError;

      if (jobData) {
        setCurrentAiStatus(jobData.ai_status as AIStatus);
        setCurrentCoverLetter(jobData.cover_letter || '');
      }

      if (tailoredData) {
        setMatchAnalytics(tailoredData.full_tailored_data);
        setEditableTailoredData({
          summary: tailoredData.tailored_summary,
          experience: tailoredData.tailored_experience,
          skills: tailoredData.tailored_skills
        });
      }

      toast.success('Status refreshed');
    } catch (err: any) {
      console.error('Refresh Status Error:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      toast.error('Failed to refresh status: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveDescriptionAndProceed = async () => {
    if (!task || !pendingJobDescription.trim()) return;

    setIsSavingDescription(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from('jobs') as any)
        .update({ description: pendingJobDescription })
        .eq('id', task.id);

      if (error) throw error;

      setShowDescriptionDialog(false);
      toast.success('Job description saved');

      // Proceed with the action that triggered the dialog
      if (descriptionAction === 'tailor') {
        handleTailorResume();
      } else if (descriptionAction === 'cover_letter') {
        handleGenerateCoverLetter();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save description');
    } finally {
      setIsSavingDescription(false);
      setDescriptionAction(null);
    }
  };

  const handleTailorResume = async () => {
    if (!task || !task.selectedResume) {
      toast.error('No resume selected');
      return;
    }

    // Check if job has description
    if (!task.profileDetails?.job_description && !pendingJobDescription) {
      setDescriptionAction('tailor');
      setShowDescriptionDialog(true);
      return;
    }

    setIsTailoring(true);
    setCurrentAiStatus('In Progress');

    try {
      const response = await fetch('/api/admin/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          resumeId: task.selectedResume.id,
          jobDescription: pendingJobDescription || task.profileDetails?.job_description
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Tailoring failed');

      toast.success('Resume tailoring completed!');
      handleRefreshStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Tailoring failed');
      setCurrentAiStatus('Error');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!task || !task.selectedResume) {
      toast.error('No resume selected');
      return;
    }

    // Check if job has description
    if (!task.profileDetails?.job_description && !pendingJobDescription) {
      setDescriptionAction('cover_letter');
      setShowDescriptionDialog(true);
      return;
    }

    setIsGeneratingCL(true);
    try {
      const response = await fetch('/api/admin/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          resumeId: task.selectedResume.id,
          jobDescription: pendingJobDescription || task.profileDetails?.job_description,
          clientNotes: task.clientNotes,
          globalInstructions: task.globalNotes
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Generation failed');

      setCurrentCoverLetter(result.coverLetter);
      toast.success('Cover letter generated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Generation failed');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleSaveTweaks = async () => {
    if (!task || !editableTailoredData) return;
    setIsSavingTweaks(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from('tailored_resumes') as any)
        .update({
          tailored_summary: editableTailoredData.summary,
          tailored_experience: editableTailoredData.experience,
          tailored_skills: editableTailoredData.skills
        })
        .eq('job_id', task.id);

      if (error) throw error;
      toast.success('Changes saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes');
    } finally {
      setIsSavingTweaks(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!task) return;
    setIsSavingCLContent(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from('jobs') as any)
        .update({ cover_letter: currentCoverLetter })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('Cover letter saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save cover letter');
    } finally {
      setIsSavingCLContent(false);
    }
  };

  const updateExperienceField = (idx: number, field: string, value: string) => {
    if (!editableTailoredData) return;
    const newExp = [...editableTailoredData.experience];
    newExp[idx] = { ...newExp[idx], [field]: value };
    setEditableTailoredData({ ...editableTailoredData, experience: newExp });
  };

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, value: string) => {
    if (!editableTailoredData) return;
    const newExp = [...editableTailoredData.experience];
    const newBullets = [...newExp[expIdx].tailored_bullets];
    newBullets[bulletIdx] = value;
    newExp[expIdx] = { ...newExp[expIdx], tailored_bullets: newBullets };
    setEditableTailoredData({ ...editableTailoredData, experience: newExp });
  };

  const updateSkills = (value: string) => {
    if (!editableTailoredData) return;
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s !== '');
    setEditableTailoredData({ ...editableTailoredData, skills: skillsArray });
  };

  const handleDownloadResume = (type: 'original' | 'tailored') => {
    if (type === 'original') {
      if (!task?.selectedResume?.file_path) {
        toast.error('Original resume file path not found');
        return;
      }
      window.open(`/api/resume/download?path=${encodeURIComponent(task.selectedResume.file_path)}`, '_blank');
    } else {
      handleDownloadTailoredPdf();
    }
  };

  const handleDownloadTailoredPdf = () => {
    if (!task?.id) return;
    window.open(`/api/resume/download?taskId=${task.id}&type=tailored`, '_blank');
  };

  const handleDownloadCoverLetter = (format: 'pdf' | 'docx') => {
    if (!currentCoverLetter) {
      toast.error('No cover letter content to download');
      return;
    }

    const generateFilename = (ext: string) => {
      const company = task?.company?.trim();
      // "Unknown" creates generic filenames, so treat it as missing
      if (company && company.length > 1 && company.toLowerCase() !== 'unknown') {
        const safeCompany = company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        // EXACT FORMAT: coverletter_companyname
        return `coverletter_${safeCompany}.${ext}`;
      } else {
        const clientName = task?.clientName?.trim() || 'Candidate';
        const safeClient = clientName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        // EXACT FORMAT: cover_letter_user_name
        return `cover_letter_${safeClient}.${ext}`;
      }
    };

    if (format === 'pdf') {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const lines = doc.splitTextToSize(currentCoverLetter, maxLineWidth);
        doc.text(lines, margin, 25);

        doc.save(generateFilename('pdf'));
        toast.success('Cover letter PDF generated!');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate PDF');
      }
    } else {
      const blob = new Blob([currentCoverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateFilename('txt');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Cover letter downloaded as .txt');
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.warning('Please upload a PDF file.');
      return;
    }

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      toast.warning(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 3MB limit.`);
      return;
    }

    setProofFile(file);
    setProofUploadStatus('uploading');

    try {
      if (!task) throw new Error('No task selected');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', task.jobId);

      const response = await fetch('/api/admin/upload-proof', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { path } = await response.json();
      setProofPath(path);
      setProofUploadStatus('success');
      toast.success('Proof uploaded successfully!');
    } catch (error) {
      console.error('Error uploading proof:', error);
      setProofUploadStatus('error');
      toast.error('Failed to upload proof');
      setProofFile(null);
    }
  };

  const handleCustomResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.warning('Please upload a PDF file.');
      return;
    }

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      toast.warning(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 3MB limit.`);
      return;
    }

    setCustomResumeFile(file);
    setCustomResumeUploadStatus('uploading');

    try {
      if (!task) throw new Error('No task selected');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', task.jobId);
      formData.append('type', 'custom_resume');

      const response = await fetch('/api/admin/upload-proof', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { path } = await response.json();
      setCustomResumePath(path);
      setCustomResumeUploadStatus('success');
      toast.success('Custom resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading custom resume:', error);
      setCustomResumeUploadStatus('error');
      toast.error('Failed to upload custom resume');
      setCustomResumeFile(null);
    }
  };


  const handleSubmit = async () => {
    try {
      await onSubmit({
        screenshotUrl: proofPath, // Legacy field name for compatibility, storing path
        proofPath: proofPath, // New explicit field
        customResumePath: customResumePath // NEW
      });
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity ${task ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {task.jobTitle} @ {task.company}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {task.clientName} • {task.clientEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-4 flex-wrap">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'Applying' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
            }`}>
            {task.status}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {task.priority}
          </span>
          {/* Credits display */}
          <span className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center gap-2 border ${(task.credits ?? 0) === 0 ? 'bg-red-50 text-red-700 border-red-200' :
            (task.credits ?? 0) < 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`} title="Client's remaining application credits">
            <span>{(task.credits ?? 0) === 0 ? '⛔' : (task.credits ?? 0) < 50 ? '⚠️' : '✅'}</span>
            Credits: {task.credits ?? 0}
          </span>
          {task.assignedTo ? (
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${task.assignedTo === currentAdminId ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              {(task.assignedTo === currentAdminId && currentAdminId) ? 'My Assignment' : `Assigned to: ${task.assignedToName}`}
            </span>
          ) : (
            <button
              onClick={() => onClaim?.(task)}
              className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-sm"
            >
              Claim Task
            </button>
          )}

          {/* AI Status Badge with Refresh */}
          <div className="flex items-center gap-2 ml-auto">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${currentAiStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
              currentAiStatus === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                currentAiStatus === 'Error' ? 'bg-red-50 text-red-700 border border-red-100' :
                  'bg-gray-50 text-gray-500 border border-gray-100'
              }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${currentAiStatus === 'Completed' ? 'bg-emerald-500' :
                currentAiStatus === 'In Progress' ? 'bg-blue-500 animate-pulse' :
                  currentAiStatus === 'Error' ? 'bg-red-500' :
                    'bg-gray-400'
                }`} />
              AI: {currentAiStatus}
            </div>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className={`p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
              title="Refresh AI Status"
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Job Description Dialog */}
        <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
          <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden bg-white">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  Deployment Blueprint Required
                </DialogTitle>
                <DialogDescription className="text-blue-100 font-medium">
                  We need the target job description to configure the AI engine for this mission.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="job-description" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Job Description Content</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the full job posting text here..."
                  className="min-h-[300px] bg-gray-50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-blue-100 resize-none no-scrollbar"
                  value={pendingJobDescription}
                  onChange={(e) => setPendingJobDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-2xl font-bold text-gray-500 hover:bg-gray-100"
                  onClick={() => setShowDescriptionDialog(false)}
                >
                  Cancel Mission
                </Button>
                <Button
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                  onClick={handleSaveDescriptionAndProceed}
                  disabled={isSavingDescription || !pendingJobDescription.trim()}
                >
                  {isSavingDescription ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </div>
                  ) : 'Initialize & Proceed'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('applicant')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'applicant'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Job & Profile
          </button>
          <button
            onClick={() => setActiveTab('inputs')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'inputs'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Client Inputs
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'documents'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Documents & Submission
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Applicant & Job Tab */}
            {activeTab === 'applicant' && (
              <div className="space-y-6 pb-10">
                {/* ... existing job heading ... */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Target Job</h3>
                  <h2 className="text-xl font-bold mb-4">{task.jobTitle} @ {task.company}</h2>
                  <a
                    href={task.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-sm active:scale-[0.98]"
                  >
                    Open Job Description
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </div>

                {task.profileDetails ? (
                  <ProfileDetailsWithSearch profileDetails={task.profileDetails} profileSearch={profileSearch} setProfileSearch={setProfileSearch} task={task} />

                ) : (
                  <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">No complete profile data available for this task.</p>
                  </div>
                )}
              </div>
            )}

            {/* Client Inputs Tab */}
            {activeTab === 'inputs' && (
              <div className="space-y-8 pb-10">
                {/* Global Instructions Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1 flex items-center gap-2">
                    <ClipboardList className="h-3 w-3" />
                    Global Deployment Instructions
                  </h3>
                  <div className="bg-white border-2 border-blue-50 rounded-3xl p-6 shadow-sm">
                    {task.globalNotes ? (
                      <div className="bg-blue-50/30 border border-blue-100/30 rounded-2xl p-5">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium italic">
                          "{task.globalNotes}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400 font-medium italic">No global instructions provided by the client.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Notes Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Job Specific Notes
                  </h3>
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                    {task.clientNotes ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {task.clientNotes}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400 font-medium italic">No specific notes provided for this application.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certifications Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Client Certifications</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {task.certifications && task.certifications.length > 0 ? (
                      task.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{cert.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{cert.date || 'No date specified'}</p>
                            </div>
                          </div>
                          {cert.url && (
                            <a
                              href={cert.url.startsWith('http') ? cert.url : `/api/resume/view?path=${encodeURIComponent(cert.url)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm"
                            >
                              View Asset
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center">
                        <p className="text-xs text-slate-400 italic">No certifications attached to this profile.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Resume & Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-8 pb-10">
                {/* Resume Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Resume Handling</h3>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${currentAiStatus === 'Completed' ? 'bg-green-500' : currentAiStatus === 'In Progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{currentAiStatus}</span>
                    </div>
                  </div>

                  {task.selectedResume ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-50 rounded-2xl">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{task.selectedResume.title || 'Standard Resume'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Master Source • {task.selectedResume.job_role || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadResume('original')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200"
                          >
                            Download Original
                          </button>
                          <button
                            onClick={() => window.open(`/api/resume/view?path=${encodeURIComponent(task.selectedResume?.file_path || '')}`, '_blank')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {task.featureAccess?.resume_tailor_enabled && currentAiStatus !== 'Completed' && currentAiStatus !== 'In Progress' && (
                          <button
                            onClick={handleTailorResume}
                            disabled={isTailoring}
                            className="w-full py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-[0.98]"
                          >
                            {isTailoring ? 'Starting AI Engine...' : 'Click to Tailor Resume'}
                          </button>
                        )}

                        {currentAiStatus === 'In Progress' && (
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            <p className="text-sm font-medium text-blue-700">AI is tailoring your resume for this role...</p>
                          </div>
                        )}

                        {currentAiStatus === 'Completed' && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <button
                                onClick={handleDownloadTailoredPdf}
                                className="flex-1 py-4 bg-green-600 text-white text-sm font-bold rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Download Tailored PDF
                              </button>
                            </div>

                            {/* Match Intelligence Score */}
                            {matchAnalytics && (
                              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Match Intelligence</h4>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`h-2 w-2 rounded-full ${matchAnalytics.score > 80 ? 'bg-emerald-500' : matchAnalytics.score > 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xl font-black text-slate-900">{matchAnalytics.score}%</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Keyword Matches</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {matchAnalytics.matched_keywords?.length > 0 ? (
                                        matchAnalytics.matched_keywords.slice(0, 8).map((kw, i) => (
                                          <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                                            {kw}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">None detected</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-tight">Missing Gaps</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {matchAnalytics.missing_keywords?.length > 0 ? (
                                        matchAnalytics.missing_keywords.slice(0, 8).map((kw, i) => (
                                          <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-md border border-red-100">
                                            {kw}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No gaps</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tweak Mode Section */}
                            {editableTailoredData && (
                              <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-xl shadow-blue-50/50 space-y-6">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                                    <EditIcon className="h-3 w-3" />
                                    Interactive Tweak Mode
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
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Tailored Summary</label>
                                    <textarea
                                      value={editableTailoredData.summary}
                                      onChange={(e) => setEditableTailoredData({ ...editableTailoredData, summary: e.target.value })}
                                      className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                                    />
                                  </div>

                                  <div className="space-y-6 pt-2">
                                    <div className="flex items-center justify-between ml-1">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Highlight Skills (Comma separated)</p>
                                    </div>
                                    <textarea
                                      value={(editableTailoredData.skills || []).join(', ')}
                                      onChange={(e) => updateSkills(e.target.value)}
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[60px]"
                                    />
                                  </div>

                                  <div className="space-y-6 pt-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Work Experience Blueprint</p>
                                      <button
                                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
                                      >
                                        {isPreviewMode ? 'Collapse Editor' : 'Enter Preview & Edit Mode'}
                                      </button>
                                    </div>

                                    {isPreviewMode && (
                                      <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {(editableTailoredData.experience || []).map((exp: any, expIdx: number) => (
                                          <div key={expIdx} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase">Company</label>
                                                <input
                                                  type="text"
                                                  value={exp.company}
                                                  onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                                                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-bold focus:ring-1 focus:ring-blue-100"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase">Role</label>
                                                <input
                                                  type="text"
                                                  value={exp.role}
                                                  onChange={(e) => updateExperienceField(expIdx, 'role', e.target.value)}
                                                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-bold focus:ring-1 focus:ring-blue-100"
                                                />
                                              </div>
                                            </div>

                                            <div className="space-y-3">
                                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tailored Bullet Points</p>
                                              <div className="space-y-2">
                                                {(exp.tailored_bullets || []).map((bullet: string, bulletIdx: number) => (
                                                  <div key={bulletIdx} className="p-1 bg-white rounded-xl border border-slate-100">
                                                    <textarea
                                                      value={bullet}
                                                      onChange={(e) => updateExperienceBullet(expIdx, bulletIdx, e.target.value)}
                                                      className="w-full bg-transparent border-none focus:ring-0 text-[11px] leading-relaxed p-2 min-h-[60px] resize-none"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {!isPreviewMode && (
                                      <p className="text-[10px] text-gray-400 italic font-medium text-center">To edit individual work experience, use the Preview & Edit mode.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-yellow-50 rounded-3xl border border-yellow-100">
                      <p className="text-sm text-yellow-800 font-bold">⚠️ No Resume Selected</p>
                    </div>
                  )}
                </div>

                {/* Cover Letter Section */}
                {task.featureAccess?.cover_letter_enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Cover Letter</h3>
                      <div className="flex items-center gap-2">
                        {currentCoverLetter && (
                          <>
                            <button
                              onClick={() => handleDownloadCoverLetter('pdf')}
                              className="text-[10px] font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => copyToClipboard(currentCoverLetter, 'Cover Letter')}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                              Copy Text
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {currentCoverLetter ? (
                      <div className="space-y-4">
                        <div className="bg-white border-2 border-blue-50 rounded-3xl p-6 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                              <ClipboardList className="h-3 w-3" />
                              Edit Content
                            </span>
                            <button
                              onClick={handleSaveCoverLetter}
                              disabled={isSavingCLContent}
                              className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
                            >
                              {isSavingCLContent ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                          <textarea
                            value={currentCoverLetter}
                            onChange={(e) => setCurrentCoverLetter(e.target.value)}
                            className="w-full text-sm text-gray-800 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[400px] font-sans leading-relaxed resize-none"
                            placeholder="Edit cover letter here..."
                          />
                        </div>
                        <button
                          onClick={handleGenerateCoverLetter}
                          disabled={isGeneratingCL}
                          className="w-full py-3 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50"
                        >
                          {isGeneratingCL ? 'Regenerating...' : 'Regenerate Cover Letter'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-400 font-medium italic">No cover letter has been generated for this application.</p>
                        </div>
                        <button
                          onClick={handleGenerateCoverLetter}
                          disabled={isGeneratingCL}
                          className="w-full py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-[0.98]"
                        >
                          {isGeneratingCL ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Resume Upload Section */}
                {task.featureAccess?.custom_resume_enabled && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Custom Resume</h3>
                    <div className="bg-white border border-gray-200 rounded-3xl p-6">
                      {!customResumePath ? (
                        <div className="text-center">
                          <label className={`block border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${customResumeUploadStatus === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleCustomResumeUpload}
                              className="hidden"
                              disabled={customResumeUploadStatus === 'uploading'}
                            />
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-3 rounded-full ${customResumeUploadStatus === 'uploading' ? 'bg-blue-100 animate-pulse' : 'bg-gray-100'}`}>
                                {customResumeUploadStatus === 'uploading' ? (
                                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                                ) : (
                                  <Upload className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-700">
                                  {customResumeUploadStatus === 'uploading' ? 'Uploading...' : 'Upload Custom Resume (PDF)'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Max 3MB</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-700" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-900">Custom Resume Uploaded</p>
                                <a href={`/api/resume/view?path=${encodeURIComponent(customResumePath)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                                  View file <Eye className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <label className="block border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleCustomResumeUpload}
                              className="hidden"
                              disabled={customResumeUploadStatus === 'uploading'}
                            />
                            <div className="flex items-center justify-center gap-2">
                              {customResumeUploadStatus === 'uploading' ? (
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 text-gray-400" />
                              )}
                              <p className="text-xs font-semibold text-gray-600">
                                {customResumeUploadStatus === 'uploading' ? 'Uploading...' : 'Replace custom resume'}
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Proof of Application Section */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Proof of Application</h3>

                  <div className="bg-white border border-gray-200 rounded-3xl p-6">
                    {!proofPath ? (
                      <div className="text-center">
                        <label className={`block border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${proofUploadStatus === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleProofUpload}
                            className="hidden"
                            disabled={proofUploadStatus === 'uploading'}
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className={`p-3 rounded-full ${proofUploadStatus === 'uploading' ? 'bg-blue-100 animate-pulse' : 'bg-gray-100'}`}>
                              {proofUploadStatus === 'uploading' ? (
                                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                              ) : (
                                <Upload className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">
                                {proofUploadStatus === 'uploading' ? 'Uploading...' : 'Upload Application Proof (PDF)'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Max 3MB</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-green-50/50 border border-green-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-900">Proof Uploaded</p>
                              <a href={`/api/resume/view?path=${encodeURIComponent(proofPath)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:underline flex items-center gap-1">
                                View file <Eye className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <label className="block border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleProofUpload}
                            className="hidden"
                            disabled={proofUploadStatus === 'uploading'}
                          />
                          <div className="flex items-center justify-center gap-2">
                            {proofUploadStatus === 'uploading' ? (
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 text-gray-400" />
                            )}
                            <p className="text-xs font-semibold text-gray-600">
                              {proofUploadStatus === 'uploading' ? 'Uploading...' : 'Replace with different file'}
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Proof of Work Tab */}
          </div>
        </div>

        {/* Footer - Submit Button */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !proofPath || (task.featureAccess?.custom_resume_enabled && !customResumePath) || (task.assignedTo !== currentAdminId && !!task.assignedTo) || (task.credits ?? 0) <= 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Mark as Applied'}
            </button>
          </div>
          {(task.credits ?? 0) <= 0 && (
            <p className="text-[10px] text-red-600 font-bold mt-2 text-center uppercase tracking-wider">
              ⚠️ Client has no credits remaining. Cannot submit application.
            </p>
          )}
          {task.assignedTo && currentAdminId && task.assignedTo !== currentAdminId && (
            <p className="text-[10px] text-red-500 font-bold mt-2 text-center uppercase tracking-wider">
              ⚠️ Warning: This mission is assigned to another agent ({task.assignedToName}).
            </p>
          )}
          {task.assignedTo && !currentAdminId && (
            <p className="text-[10px] text-slate-500 font-bold mt-2 text-center uppercase tracking-wider italic">
              Authenticating credentials...
            </p>
          )}
          {!task.assignedTo && (
            <p className="text-[10px] text-amber-600 font-bold mt-2 text-center uppercase tracking-wider">
              ⚠️ Warning: Claim this mission before beginning deployment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ title, children, defaultExpanded = false, highlighted = false }: { title: string; children: React.ReactNode; defaultExpanded?: boolean; highlighted?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-3xl border transition-all duration-200 overflow-hidden ${highlighted ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'} ${isExpanded ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${isExpanded ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/50'}`}
      >
        <h4 className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${highlighted ? 'text-blue-600' : 'text-gray-400'}`}>{title}</h4>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="bg-white px-6 pb-6 pt-2 grid grid-cols-2 gap-x-6 gap-y-5">
          {children}
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value, isLink, colSpan }: { label: string; value?: any; isLink?: boolean; colSpan?: number }) {
  const [copied, setCopied] = useState(false);

  let displayValue = value;

  if (value === undefined || value === null || value === '') {
    displayValue = '-';
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (Array.isArray(value)) {
    displayValue = value.length > 0 ? value.join(', ') : '-';
  } else if (typeof value === 'object') {
    displayValue = '-';
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayValue === '-' || !displayValue) return;
    navigator.clipboard.writeText(String(displayValue));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
        {copied && <span className="text-[9px] text-green-600 font-bold animate-pulse">Copied!</span>}
      </div>

      <div className="group relative flex items-center gap-2">
        <p
          onClick={handleCopy}
          className={`text-sm font-semibold break-words cursor-pointer transition-colors p-1 -ml-1 rounded
            ${copied ? 'text-green-700 bg-green-50' : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'}
            ${isLink ? 'text-blue-600' : ''}`}
          title="Click to copy"
        >
          {String(displayValue)}
        </p>

        {isLink && displayValue !== '-' && (
          <a
            href={String(displayValue).startsWith('http') ? String(displayValue) : `https://${displayValue}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="Open Link"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        )}
      </div>
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Helper to check if search matches a section's keywords
function matchesSearch(search: string, keywords: string[]): boolean {
  if (!search) return false;
  const searchLower = search.toLowerCase();
  return keywords.some(k => k.includes(searchLower) || searchLower.includes(k));
}

// Profile Details with Search component - handles sorting matched sections to top
function ProfileDetailsWithSearch({
  profileDetails,
  profileSearch,
  setProfileSearch,
  task
}: {
  profileDetails: any;
  profileSearch: string;
  setProfileSearch: (s: string) => void;
  task: VACoreTask | null;
}) {
  // Define all sections with their keywords and render functions
  const sections = [
    {
      id: 'personal',
      title: 'Core Personal Details',
      keywords: ['first name', 'middle name', 'last name', 'email', 'phone', 'date of birth', 'password', 'ssn', 'driving license', 'personal'],
      render: () => {
        const isUpdated = task?.profileUpdatedAt && task?.createdAt && new Date(task.profileUpdatedAt) > new Date(task.createdAt);
        return (
          <>
            {isUpdated && (
              <div className="col-span-2 mb-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Client Recently Updated Profile</span>
              </div>
            )}
            <ProfileField label="First Name" value={profileDetails.first_name} />
            <ProfileField label="Middle Name" value={profileDetails.middle_name} />
            <ProfileField label="Last Name" value={profileDetails.last_name} />
            <ProfileField label="Email Address" value={profileDetails.email} />
            <ProfileField label="Phone Number" value={profileDetails.phone} />
            <ProfileField label="Date of Birth" value={profileDetails.date_of_birth} />
            <ProfileField label="Application Password" value={profileDetails.password_applications} />
            <ProfileField label="SSN Number" value={profileDetails.ssn} />
            <ProfileField label="Driving License" value={profileDetails.driving_license} />
          </>
        );
      },
    },
    {
      id: 'address',
      title: 'Address & Geographic Details',
      keywords: ['address', 'city', 'county', 'state', 'zip', 'country', 'nationality', 'preferred cities', 'location', 'geographic'],
      render: () => (
        <>
          <ProfileField label="Address Line 1" value={profileDetails.address_line_1} colSpan={2} />
          <ProfileField label="Address Line 2" value={profileDetails.address_line_2} colSpan={2} />
          <ProfileField label="City" value={profileDetails.city} />
          <ProfileField label="County" value={profileDetails.county} />
          <ProfileField label="State / Province" value={profileDetails.state} />
          <ProfileField label="Zip / Postal Code" value={profileDetails.zipcode} />
          <ProfileField label="Country" value={profileDetails.country} />
          <ProfileField label="Nationality" value={profileDetails.nationality} />
          <ProfileField label="Preferred Cities" value={profileDetails.preferred_cities} colSpan={2} />
        </>
      ),
    },
    {
      id: 'compensation',
      title: 'Job Preferences & Compensation',
      keywords: ['salary', 'hourly', 'notice', 'start date', 'compensation', 'pay', 'rate'],
      render: () => (
        <>
          <ProfileField label="Desired Salary (Annual)" value={profileDetails.desired_salary} />
          <ProfileField label="Desired Hourly Rate" value={profileDetails.desired_salary_range} />
          <ProfileField label="Current Salary" value={profileDetails.current_salary} />
          <ProfileField label="Notice Period" value={profileDetails.notice_period} />
          <ProfileField label="Available Start Date" value={profileDetails.start_date} />
        </>
      ),
    },
    {
      id: 'education',
      title: 'Academic History',
      keywords: ['university', 'college', 'degree', 'field of study', 'gpa', 'education', 'graduated', 'school', 'academic'],
      render: () => (
        <>
          <ProfileField label="University / College" value={profileDetails.university} colSpan={2} />
          <ProfileField label="Degree" value={profileDetails.degree} />
          <ProfileField label="Field of Study" value={profileDetails.field_of_study} />
          <ProfileField label="GPA" value={profileDetails.gpa} />
          <ProfileField label="Started On" value={profileDetails.education_from} />
          <ProfileField label="Graduated On" value={profileDetails.education_to} />
        </>
      ),
    },
    {
      id: 'workExperience',
      title: 'Work Experience',
      keywords: ['work experience', 'company', 'job title', 'employment', 'experience', 'employer'],
      render: () => (
        <>
          {profileDetails.work_experience && profileDetails.work_experience.length > 0 ? (
            profileDetails.work_experience.map((exp: any, i: number) => (
              <div key={i} className="col-span-2 p-5 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-2 gap-4 relative group">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-white border border-gray-100 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Experience {i + 1}
                </div>
                <ProfileField label="Company" value={exp.company_name} />
                <ProfileField label="Job Title" value={exp.job_title} />
                <ProfileField label="Location" value={exp.location} />
                <ProfileField label="Type" value={exp.experience_type} />
                <ProfileField label="Start Date" value={exp.start_date} />
                <ProfileField label="End Date" value={exp.currently_working ? 'Currently Working' : exp.end_date} />
                <ProfileField label="Description" value={exp.description} colSpan={2} />
              </div>
            ))
          ) : (
            <div className="col-span-2 py-6 text-center">
              <p className="text-xs text-gray-400 italic">No work experience added</p>
            </div>
          )}
        </>
      ),
    },
    {
      id: 'workAuth',
      title: 'Work Auth & Citizenship',
      keywords: ['citizen', 'visa', 'sponsorship', 'h1b', 'work auth', 'eligible', 'clearance', 'authorization', 'citizenship'],
      render: () => (
        <>
          <ProfileField label="US Citizen" value={profileDetails.is_us_citizen} />
          <ProfileField label="Eligible to Work in US" value={profileDetails.eligible_to_work_us} />
          <ProfileField label="Needs Sponsorship" value={profileDetails.needs_sponsorship} />
          <ProfileField label="Sponsorship Type" value={profileDetails.sponsorship_type} />
          <ProfileField label="Authorized to Work" value={profileDetails.authorized_work} />
          <ProfileField label="Citizenship Status" value={profileDetails.citizenship_status} />
          <ProfileField label="Visa Start Date" value={profileDetails.visa_start_date} />
          <ProfileField label="Visa Expiration Date" value={profileDetails.visa_expiration_date} />
          <ProfileField label="H1B Caps/Info" value={profileDetails.h1b_info} colSpan={2} />
          <ProfileField label="Visa Status Explanation" value={profileDetails.visa_status_explanation} colSpan={2} />
          <ProfileField label="Security Clearance" value={profileDetails.security_clearance} />
        </>
      ),
    },
    {
      id: 'availability',
      title: 'Availability & Flexibility',
      keywords: ['relocate', 'travel', 'overtime', 'shift', 'days', 'languages', 'availability', 'flexible'],
      render: () => (
        <>
          <ProfileField label="Willing to Relocate" value={profileDetails.willing_to_relocate} />
          <ProfileField label="Willing to Travel %" value={profileDetails.travel_percentage} />
          <ProfileField label="Travel Experience" value={profileDetails.experience_travel} />
          <ProfileField label="Able to work Overtime" value={profileDetails.able_overtime} />
          <ProfileField label="Preferred Shift" value={profileDetails.preferred_shift} />
          <ProfileField label="Preferred Days" value={profileDetails.preferred_days} />
          <ProfileField label="Languages" value={profileDetails.languages} />
        </>
      ),
    },
    {
      id: 'social',
      title: 'Social & Online Presence',
      keywords: ['linkedin', 'github', 'portfolio', 'website', 'social', 'online', 'url'],
      render: () => (
        <>
          <ProfileField label="LinkedIn Profile" value={profileDetails.linkedin_url} isLink colSpan={2} />
          <ProfileField label="GitHub Profile" value={profileDetails.github_url} isLink colSpan={2} />
          <ProfileField label="Portfolio / Website" value={profileDetails.portfolio_url} isLink colSpan={2} />
          <ProfileField label="LinkedIn Login Email" value={profileDetails.linkedin_email} />
          <ProfileField label="LinkedIn Password" value={profileDetails.linkedin_password} />
        </>
      ),
    },
    {
      id: 'demographics',
      title: 'Demographics & Diversity',
      keywords: ['veteran', 'gender', 'ethnicity', 'sexual', 'disabilities', 'diversity', 'demographic'],
      render: () => (
        <>
          <ProfileField label="Veteran Status" value={profileDetails.is_veteran} />
          <ProfileField label="Gender" value={profileDetails.gender} />
          <ProfileField label="Ethnicity" value={profileDetails.ethnicity} />
          <ProfileField label="Sexual Orientation" value={profileDetails.sexual_orientation} />
          <ProfileField label="Disabilities" value={profileDetails.disabilities} colSpan={2} />
        </>
      ),
    },
    {
      id: 'security',
      title: 'Security Questions & Verification',
      keywords: ['security', 'question', 'verification', 'answer'],
      render: () => (
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 1</p>
              <p className="text-sm font-semibold text-gray-600 italic">"{profileDetails.security_q1 || "Question 1"}"</p>
            </div>
            <ProfileField label="Answer 1" value={profileDetails.security_a1} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div className="col-span-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 2</p>
              <p className="text-sm font-semibold text-gray-600 italic">"{profileDetails.security_q2 || "Question 2"}"</p>
            </div>
            <ProfileField label="Answer 2" value={profileDetails.security_a2} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div className="col-span-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 3</p>
              <p className="text-sm font-semibold text-gray-600 italic">"{profileDetails.security_q3 || "Question 3"}"</p>
            </div>
            <ProfileField label="Answer 3" value={profileDetails.security_a3} />
          </div>
        </div>
      ),
    },
    {
      id: 'references',
      title: 'Professional References',
      keywords: ['reference', 'referral', 'recommendation'],
      render: () => (
        <>
          {profileDetails.references && profileDetails.references.length > 0 ? (
            profileDetails.references.map((ref: any, i: number) => (
              <div key={i} className="col-span-2 p-5 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-2 gap-4 relative group">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-white border border-gray-100 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Ref {i + 1}
                </div>
                <ProfileField label="Name" value={ref.name} />
                <ProfileField label="Relationship" value={ref.relationship} />
                <ProfileField label="Position" value={ref.position} />
                <ProfileField label="Phone" value={ref.phone} />
                <ProfileField label="Email" value={ref.email} colSpan={2} />
              </div>
            ))
          ) : (
            <div className="col-span-2 py-6 text-center">
              <p className="text-xs text-gray-400 italic">No references added</p>
            </div>
          )}
        </>
      ),
    },
  ];

  // Sort sections: matching ones first (auto-expanded), non-matching after
  const sortedSections = React.useMemo(() => {
    if (!profileSearch) return sections;

    const matched: typeof sections = [];
    const unmatched: typeof sections = [];

    sections.forEach(section => {
      if (matchesSearch(profileSearch, section.keywords)) {
        matched.push(section);
      } else {
        unmatched.push(section);
      }
    });

    return [...matched, ...unmatched];
  }, [profileSearch]);

  return (
    <div className="space-y-4">
      {/* Profile Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={profileSearch}
          onChange={(e) => setProfileSearch(e.target.value)}
          placeholder="Search profile fields (e.g., email, phone, visa...)"
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
        />
        {profileSearch && (
          <button
            onClick={() => setProfileSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sortedSections.map(section => {
          const isMatch = profileSearch ? matchesSearch(profileSearch, section.keywords) : false;
          return (
            <ProfileSection
              key={section.id}
              title={section.title}
              defaultExpanded={isMatch} // Auto-expand matching sections
              highlighted={isMatch}
            >
              {section.render()}
            </ProfileSection>
          );
        })}
      </div>
    </div>
  );
}

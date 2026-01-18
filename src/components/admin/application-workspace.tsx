'use client';

import React, { useState } from 'react';
import { VACoreTask } from '@/types/admin.types';
import { Upload, FileText, X, Check, Eye, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ApplicationWorkspaceProps {
  task: VACoreTask | null;
  onClose: () => void;
  onSubmit: (proofOfWork: { screenshotUrl?: string; submissionLink?: string; proofPath?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export function ApplicationWorkspace({
  task,
  onClose,
  onSubmit,
  isSubmitting,
}: ApplicationWorkspaceProps) {

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploadStatus, setProofUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [proofPath, setProofPath] = useState<string>(task?.proofOfWork?.screenshotUrl || ''); // Reusing screenshotUrl field for storage path if needed, or mapping it.

  const [activeTab, setActiveTab] = useState<'applicant' | 'documents'>('applicant');
  const [isTailoring, setIsTailoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAiStatus, setCurrentAiStatus] = useState(task?.aiStatus || 'Pending');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [currentCoverLetter, setCurrentCoverLetter] = useState(task?.coverLetter || '');
  const [matchAnalytics, setMatchAnalytics] = useState(task?.matchAnalytics || null);
  const [editableTailoredData, setEditableTailoredData] = useState<{
    summary: string;
    experience: any[];
    skills: string[];
  } | null>(null);
  const [isSavingTweaks, setIsSavingTweaks] = useState(false);

  // Sync state with task when it changes
  React.useEffect(() => {
    if (task) {
      setCurrentAiStatus(task.aiStatus || 'Pending');
      setCurrentCoverLetter(task.coverLetter || '');
      setMatchAnalytics(task.matchAnalytics || null);
      if (task.fullTailoredData) {
        setEditableTailoredData({
          summary: task.fullTailoredData.summary || '',
          experience: task.fullTailoredData.experience || [],
          skills: task.fullTailoredData.skills || [],
        });
      } else {
        setEditableTailoredData(null);
      }
    }
  }, [task]);

  // Refresh tailored resume status
  const handleRefreshStatus = async () => {
    if (!task) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/admin/tailor/status?job_id=${task.jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.status === 'completed') {
          setCurrentAiStatus('Completed');
          if (data.data.full_tailored_data) {
            setMatchAnalytics({
              score: data.data.full_tailored_data.match_score || 0,
              matched_keywords: data.data.full_tailored_data.keywords_matched || [],
              missing_keywords: data.data.full_tailored_data.keywords_missing || [],
            });
            setEditableTailoredData({
              summary: data.data.full_tailored_data.summary || '',
              experience: data.data.full_tailored_data.experience || [],
              skills: data.data.full_tailored_data.highlighted_skills || data.data.tailored_skills || [],
            });
          }
        } else if (data.data?.status === 'processing' || data.data?.status === 'pending') {
          setCurrentAiStatus('In Progress');
        } else if (data.data?.status === 'failed') {
          setCurrentAiStatus('Error');
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Download tailored resume as PDF
  const handleDownloadTailoredPdf = async () => {
    if (!task) return;
    try {
      const response = await fetch(`/api/tailor/download?job_id=${task.jobId}`);
      if (!response.ok) {
        throw new Error('Failed to download tailored resume');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tailored_resume_${task.clientName.replace(/\s+/g, '_')}_${task.company.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading tailored resume:', error);
      alert('Failed to download tailored resume');
    }
  };

  if (!task) return null;

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only as requested)
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    // Validate file size (e.g., 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
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
        const result = await response.json();
        throw new Error(result.error || 'Upload failed');
      }

      const { path } = await response.json();

      // Store the path. We will use /api/resume/view?path=... to view it later.
      setProofPath(path);
      setProofUploadStatus('success');
    } catch (error) {
      console.error('Error uploading proof:', error);
      setProofUploadStatus('error');
      alert('Failed to upload proof file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setProofFile(null);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPath('');
    setProofUploadStatus('idle');
  };

  const handleSubmit = async () => {
    try {
      await onSubmit({
        screenshotUrl: proofPath, // Legacy field name for compatibility, storing path
        proofPath: proofPath // New explicit field
      });
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  const handleTailorResume = async () => {
    if (!task.selectedResume?.id) {
      alert('No resume selected for this job');
      return;
    }

    setIsTailoring(true);
    setCurrentAiStatus('In Progress');
    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: task.jobId, mode: 'direct' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to tailor resume');
      }

      // Direct mode returns completed immediately
      if (data.data?.status === 'completed') {
        setCurrentAiStatus('Completed');
        if (data.data.tailored) {
          setMatchAnalytics({
            score: data.data.tailored.match_score || 0,
            matched_keywords: data.data.tailored.keywords_matched || [],
            missing_keywords: data.data.tailored.keywords_missing || [],
          });
          setEditableTailoredData({
            summary: data.data.tailored.summary || '',
            experience: data.data.tailored.experience || [],
            skills: data.data.tailored.highlighted_skills || data.data.tailored.tailored_skills || [],
          });
        }
      } else {
        // Queue mode - keep as In Progress
        setCurrentAiStatus('In Progress');
      }
    } catch (error) {
      console.error('Error tailoring resume:', error);
      setCurrentAiStatus('Error');
      alert(`Failed to tailor resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!task) return;
    setIsGeneratingCL(true);
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: task.jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();
      setCurrentCoverLetter(result.cover_letter);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleSaveTweaks = async () => {
    if (!task || !editableTailoredData) return;
    setIsSavingTweaks(true);
    try {
      const response = await fetch('/api/tailor/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: task.jobId,
          tailored_summary: editableTailoredData.summary,
          tailored_experience: editableTailoredData.experience,
          tailored_skills: editableTailoredData.skills,
        }),
      });

      if (!response.ok) throw new Error('Failed to save tweaks');
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving tweaks:', error);
      alert('Failed to save changes');
    } finally {
      setIsSavingTweaks(false);
    }
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newValue: string) => {
    if (!editableTailoredData) return;
    const newExperience = [...editableTailoredData.experience];
    const newBullets = [...newExperience[expIndex].tailored_bullets];
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

  const updateSkills = (newSkillsStr: string) => {
    if (!editableTailoredData) return;
    const skills = newSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
    setEditableTailoredData({ ...editableTailoredData, skills });
  };

  const handleDownloadResume = async (type: 'original' | 'tailored') => {
    try {
      if (type === 'original' && task.selectedResume?.file_path) {
        // Download original resume
        const response = await fetch(`/api/resume/download?path=${encodeURIComponent(task.selectedResume.file_path)}`);
        if (!response.ok) throw new Error('Failed to download');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${task.clientName}_${task.selectedResume.title || 'resume'}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (type === 'tailored' && task.tailoredResumeId) {
        // Open tailored resume view
        window.open(`/tailor/${task.jobId}`, '_blank');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download resume');
    }
  };

  const handleDownloadCoverLetter = async (format: 'pdf' | 'docx') => {
    if (!task) return;
    try {
      const response = await fetch(`/api/cover-letter/download?job_id=${task.jobId}&format=${format}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${task.company.replace(/\s+/g, '_')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Operation Failed');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
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
        <div className="px-6 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'Applying' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
            }`}>
            {task.status}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentAiStatus === 'Completed' ? 'bg-green-100 text-green-700' :
            currentAiStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
              currentAiStatus === 'Error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
            }`}>
            Tailored: {currentAiStatus === 'Completed' ? 'Yes' : currentAiStatus === 'In Progress' ? 'Processing' : 'No'}
          </span>
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="Refresh tailoring status"
          >
            <RefreshIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {task.priority}
          </span>
        </div>

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
                {/* Job Posting Heading */}
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
                  <div className="grid grid-cols-1 gap-6">
                    <ProfileSection title="Core Personal Details">
                      <ProfileField label="First Name" value={task.profileDetails.first_name} />
                      <ProfileField label="Middle Name" value={task.profileDetails.middle_name} />
                      <ProfileField label="Last Name" value={task.profileDetails.last_name} />
                      <ProfileField label="Email Address" value={task.profileDetails.email} />
                      <ProfileField label="Phone Number" value={task.profileDetails.phone} />
                      <ProfileField label="Date of Birth" value={task.profileDetails.date_of_birth} />
                      <ProfileField label="Application Password" value={task.profileDetails.password_applications} />
                      <ProfileField label="SSN Number" value={task.profileDetails.ssn} />
                      <ProfileField label="Driving License" value={task.profileDetails.driving_license} />
                    </ProfileSection>

                    <ProfileSection title="Address & Geographic Details">
                      <ProfileField label="Address Line 1" value={task.profileDetails.address_line_1} colSpan={2} />
                      <ProfileField label="Address Line 2" value={task.profileDetails.address_line_2} colSpan={2} />
                      <ProfileField label="City" value={task.profileDetails.city} />
                      <ProfileField label="County" value={task.profileDetails.county} />
                      <ProfileField label="State / Province" value={task.profileDetails.state} />
                      <ProfileField label="Zip / Postal Code" value={task.profileDetails.zipcode} />
                      <ProfileField label="Country" value={task.profileDetails.country} />
                      <ProfileField label="Nationality" value={task.profileDetails.nationality} />
                      <ProfileField label="Preferred Cities" value={task.profileDetails.preferred_cities} colSpan={2} />
                    </ProfileSection>

                    <ProfileSection title="Job Preferences & Compensation">
                      <ProfileField label="Desired Salary (Annual)" value={task.profileDetails.desired_salary} />
                      <ProfileField label="Desired Hourly Rate" value={task.profileDetails.desired_salary_range} />
                      <ProfileField label="Current Salary" value={task.profileDetails.current_salary} />
                      <ProfileField label="Notice Period" value={task.profileDetails.notice_period} />
                      <ProfileField label="Available Start Date" value={task.profileDetails.start_date} />
                    </ProfileSection>

                    <ProfileSection title="Academic History">
                      <ProfileField label="University / College" value={task.profileDetails.university} colSpan={2} />
                      <ProfileField label="Degree" value={task.profileDetails.degree} />
                      <ProfileField label="Field of Study" value={task.profileDetails.field_of_study} />
                      <ProfileField label="GPA" value={task.profileDetails.gpa} />
                      <ProfileField label="Started On" value={task.profileDetails.education_from} />
                      <ProfileField label="Graduated On" value={task.profileDetails.education_to} />
                    </ProfileSection>

                    <ProfileSection title="Work Auth & Citizenship">
                      <ProfileField label="US Citizen" value={task.profileDetails.is_us_citizen} />
                      <ProfileField label="Eligible to Work in US" value={task.profileDetails.eligible_to_work_us} />
                      <ProfileField label="Needs Sponsorship" value={task.profileDetails.needs_sponsorship} />
                      <ProfileField label="Sponsorship Type" value={task.profileDetails.sponsorship_type} />
                      <ProfileField label="Authorized to Work" value={task.profileDetails.authorized_work} />
                      <ProfileField label="Citizenship Status" value={task.profileDetails.citizenship_status} />
                      <ProfileField label="Visa Start Date" value={task.profileDetails.visa_start_date} />
                      <ProfileField label="Visa Expiration Date" value={task.profileDetails.visa_expiration_date} />
                      <ProfileField label="H1B Caps/Info" value={task.profileDetails.h1b_info} colSpan={2} />
                      <ProfileField label="Visa Status Explanation" value={task.profileDetails.visa_status_explanation} colSpan={2} />
                      <ProfileField label="Security Clearance" value={task.profileDetails.security_clearance} />
                    </ProfileSection>

                    <ProfileSection title="Availability & Flexibility">
                      <ProfileField label="Willing to Relocate" value={task.profileDetails.willing_to_relocate} />
                      <ProfileField label="Willing to Travel %" value={task.profileDetails.travel_percentage} />
                      <ProfileField label="Travel Experience" value={task.profileDetails.experience_travel} />
                      <ProfileField label="Able to work Overtime" value={task.profileDetails.able_overtime} />
                      <ProfileField label="Preferred Shift" value={task.profileDetails.preferred_shift} />
                      <ProfileField label="Preferred Days" value={task.profileDetails.preferred_days} />
                      <ProfileField label="Languages" value={task.profileDetails.languages} />
                    </ProfileSection>

                    <ProfileSection title="Social & Online Presence">
                      <ProfileField label="LinkedIn Profile" value={task.profileDetails.linkedin_url} isLink colSpan={2} />
                      <ProfileField label="GitHub Profile" value={task.profileDetails.github_url} isLink colSpan={2} />
                      <ProfileField label="Portfolio / Website" value={task.profileDetails.portfolio_url} isLink colSpan={2} />
                      <ProfileField label="LinkedIn Login Email" value={task.profileDetails.linkedin_email} />
                      <ProfileField label="LinkedIn Password" value={task.profileDetails.linkedin_password} />
                    </ProfileSection>

                    <ProfileSection title="Demographics & Diversity">
                      <ProfileField label="Veteran Status" value={task.profileDetails.is_veteran} />
                      <ProfileField label="Gender" value={task.profileDetails.gender} />
                      <ProfileField label="Ethnicity" value={task.profileDetails.ethnicity} />
                      <ProfileField label="Sexual Orientation" value={task.profileDetails.sexual_orientation} />
                      <ProfileField label="Disabilities" value={task.profileDetails.disabilities} colSpan={2} />
                    </ProfileSection>

                    <ProfileSection title="Security Questions & Verification">
                      <div className="col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 1</p>
                            <p className="text-sm font-semibold text-gray-600 italic">"{task.profileDetails.security_q1 || "Question 1"}"</p>
                          </div>
                          <ProfileField label="Answer 1" value={task.profileDetails.security_a1} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                          <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 2</p>
                            <p className="text-sm font-semibold text-gray-600 italic">"{task.profileDetails.security_q2 || "Question 2"}"</p>
                          </div>
                          <ProfileField label="Answer 2" value={task.profileDetails.security_a2} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                          <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Question 3</p>
                            <p className="text-sm font-semibold text-gray-600 italic">"{task.profileDetails.security_q3 || "Question 3"}"</p>
                          </div>
                          <ProfileField label="Answer 3" value={task.profileDetails.security_a3} />
                        </div>
                      </div>
                    </ProfileSection>

                    {task.profileDetails.references && task.profileDetails.references.length > 0 && (
                      <ProfileSection title="Professional References">
                        {task.profileDetails.references.map((ref: any, i: number) => (
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
                        ))}
                      </ProfileSection>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">No complete profile data available for this task.</p>
                  </div>
                )}
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
                      <span className={`h-2 w-2 rounded-full ${currentAiStatus === 'Completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{currentAiStatus}</span>
                    </div>
                  </div>

                  {task.selectedResume ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Master Source</p>
                          <p className="text-sm font-bold text-gray-900">{task.selectedResume.title || 'Standard Resume'}</p>
                          <p className="text-[11px] text-gray-500">Role: {task.selectedResume.job_role || 'Not specified'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadResume('original')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200"
                            title="Download original source file"
                          >
                            Download Original
                          </button>
                          <button
                            onClick={() => window.open(`/tailor/${task.jobId}`, '_blank')}
                            className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100"
                          >
                            Preview & Edit
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {task.aiStatus !== 'Completed' && task.aiStatus !== 'In Progress' && (
                          <button
                            onClick={handleTailorResume}
                            disabled={isTailoring}
                            className="w-full py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-[0.98]"
                          >
                            {isTailoring ? 'Starting AI Engine...' : 'Click to Tailor Resume'}
                          </button>
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
                                      {matchAnalytics.matched_keywords.length > 0 ? (
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
                                      {matchAnalytics.missing_keywords.length > 0 ? (
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

                                {matchAnalytics.score < 80 && (
                                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <p className="text-[10px] text-amber-800 font-bold leading-tight">
                                      Tip: Consider adding some of the "Missing Gaps" to the master resume if applicable to boost the score.
                                    </p>
                                  </div>
                                )}
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
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Editable Work History</p>
                                    {editableTailoredData.experience.map((exp, expIdx) => (
                                      <div key={expIdx} className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Company</label>
                                            <input
                                              type="text"
                                              value={exp.company}
                                              onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-50"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Role / Title</label>
                                            <input
                                              type="text"
                                              value={exp.role || exp.title}
                                              onChange={(e) => updateExperienceField(expIdx, exp.role ? 'role' : 'title', e.target.value)}
                                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-50"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Start Date</label>
                                            <input
                                              type="text"
                                              value={exp.startDate || exp.start_date}
                                              onChange={(e) => updateExperienceField(expIdx, exp.startDate ? 'startDate' : 'start_date', e.target.value)}
                                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-50"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">End Date</label>
                                            <input
                                              type="text"
                                              value={exp.endDate || exp.end_date}
                                              onChange={(e) => updateExperienceField(expIdx, exp.endDate ? 'endDate' : 'end_date', e.target.value)}
                                              className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-50"
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                          <p className="text-[8px] font-black text-slate-400 uppercase ml-1">Tailored Bullet Points</p>
                                          {exp.tailored_bullets?.map((bullet: string, bIdx: number) => (
                                            <div key={bIdx} className="flex gap-2">
                                              <span className="text-slate-300 mt-2 text-xs font-black">•</span>
                                              <textarea
                                                value={bullet}
                                                onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-50 resize-none min-h-[60px]"
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
                        )}
                      </div>

                      {/* Status Messages */}
                      {currentAiStatus === 'In Progress' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm font-medium text-blue-700">AI is crafting a tailored resume for this role...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-yellow-50 rounded-3xl border border-yellow-100">
                      <p className="text-sm text-yellow-800 font-bold">⚠️ No Resume Selected</p>
                    </div>
                  )}
                </div>

                {/* Cover Letter Section */}
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
                            onClick={() => handleDownloadCoverLetter('docx')}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            Word
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
                      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm max-h-[400px] overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {currentCoverLetter}
                        </pre>
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

                {/* Proof of Application Section */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Proof of Application</h3>

                  {/* Submission Link (Optional) */}


                  {/* PDF Upload */}
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
                              <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
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
                        <button
                          onClick={handleRemoveProof}
                          className="p-2 text-green-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
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
              disabled={isSubmitting || !proofPath}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Mark as Applied'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] px-1">{title}</h4>
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm grid grid-cols-2 gap-x-6 gap-y-5">
        {children}
      </div>
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

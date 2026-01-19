'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

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

interface ResumesSectionProps {
  resumes: Resume[];
  onUpdate?: () => void;
}

export function ResumesSection({ resumes, onUpdate }: ResumesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        alert('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !jobRole.trim()) {
      alert('Please enter a job role and select a file');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Start both in parallel for maximum speed
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;

      const uploadPromise = supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      const dbPromise = (supabase.from('resumes') as any)
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          file_type: 'application/pdf',
          job_role: jobRole.trim(),
          title: jobRole.trim(),
          status: 'ready',
          is_primary: resumes.length === 0, // First resume is primary
        })
        .select()
        .single();

      const [uploadResult, dbResult] = await Promise.all([uploadPromise, dbPromise]);

      if (uploadResult.error) throw uploadResult.error;
      if (dbResult.error) {
        // Cleanup storage on DB error
        await supabase.storage.from('resumes').remove([fileName]);
        throw dbResult.error;
      }

      // Reset form and refresh
      setJobRole('');
      setSelectedFile(null);
      setShowAddForm(false);
      onUpdate?.();

      // Trigger parsing
      try {
        await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId: dbResult.data.id }),
        });
        onUpdate?.(); // Refresh again to show status change
      } catch (parseErr) {
        console.error('Auto-parsing failed:', parseErr);
      }

      // Open the uploaded resume in a new tab
      const { data: urlData, error: urlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(fileName, 3600);

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
      } else if (urlData?.signedUrl) {
        window.open(urlData.signedUrl, '_blank');
      } else {
        console.error('No signed URL returned');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateRole = async (resumeId: string) => {
    if (!editRole.trim()) return;

    try {
      const { error } = await (supabase
        .from('resumes') as any)
        .update({
          job_role: editRole.trim(),
          title: editRole.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumeId);

      if (error) throw error;
      setEditingId(null);
      setEditRole('');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating resume:', error);
    }
  };

  const handleDelete = async (resume: Resume) => {
    if (!confirm(`Delete "${resume.job_role || resume.file_name}"?`)) return;

    try {
      await supabase.storage.from('resumes').remove([resume.file_path]);
      await (supabase.from('resumes') as any).delete().eq('id', resume.id);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const handlePreview = async (filePath: string) => {
    try {
      const { data: urlData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600);

      if (urlData?.signedUrl) {
        window.open(urlData.signedUrl, '_blank');
      } else {
        alert('Could not generate preview URL');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to open preview');
    }
  };

  const handleSetDefault = async (resumeId: string) => {
    try {
      const response = await fetch('/api/resume/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId }),
      });

      if (!response.ok) throw new Error('Failed to set default');
      onUpdate?.();
    } catch (error) {
      console.error('Error setting default resume:', error);
      alert('Failed to set default resume');
    }
  };

  // Check if this resume should be auto-default (only one resume exists)
  const isAutoDefault = (resumeId: string) => {
    if (resumes.length === 1) return true;
    return false;
  };

  const getDefaultResume = () => {
    // First check for explicitly set default
    const explicit = resumes.find(r => r.is_default);
    if (explicit) return explicit;
    // If only one resume, it's auto-default
    if (resumes.length === 1) return resumes[0];
    return null;
  };

  const defaultResume = getDefaultResume();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">My Resumes</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} available
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
          >
            <PlusIcon className="h-4 w-4" />
            Upload Resume
          </button>
        )}
      </div>

      {/* Modern Add Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl shadow-blue-50/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <PlusIcon className="h-5 w-5" />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Upload New Resume</h4>
          </div>

          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resume for Job Role</label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select PDF Resume</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  required={!selectedFile}
                />
                <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold flex items-center justify-between">
                  <span className={selectedFile ? "text-slate-900" : "text-slate-400"}>
                    {selectedFile ? selectedFile.name : "Select PDF file..."}
                  </span>
                  <div className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500">Browse</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading || !selectedFile || !jobRole.trim()}
                className="flex-1 py-4 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <CheckIcon className="h-4 w-4" />}
                {uploading ? 'Uploading Resume...' : 'Upload Resume'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setJobRole('');
                  setSelectedFile(null);
                }}
                className="px-8 py-4 bg-slate-100 text-slate-600 text-sm font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* High-End Resume List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resumes.length === 0 && !showAddForm ? (
          <div className="md:col-span-2 py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              <FolderIcon className="h-12 w-12 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-900 italic">No Resumes Uploaded</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">Upload your resume to start applying for jobs.</p>
          </div>
        ) : (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(resume.file_path)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-slate-100"
                    title="Preview Resume"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(resume.id);
                      setEditRole(resume.job_role || '');
                    }}
                    className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all shadow-sm border border-slate-100"
                    title="Edit Title"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resume)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-slate-100"
                    title="Delete Resume"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editingId === resume.id ? (
                <div className="flex flex-col gap-3 py-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter ml-1">Update Resume Role</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateRole(resume.id)}
                      className="flex-1 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditRole('');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-red-50 text-red-500 rounded-2xl relative overflow-hidden group-hover:scale-110 transition-transform">
                    <PdfIcon className="h-8 w-8 relative z-10" />
                    <div className="absolute inset-0 bg-red-100 opacity-20 transform -rotate-12 translate-x-2"></div>
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-1">
                      {(resume.is_default || (resumes.length === 1)) ? (
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <StarIcon className="h-3 w-3" />
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(resume.id);
                          }}
                          className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 tracking-tight truncate leading-tight">
                      {resume.job_role || resume.title || 'Untitled Profile'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1 tracking-tight flex items-center gap-2">
                      <FileIcon className="h-3 w-3" />
                      {resume.file_name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>;
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>;
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
}
function EditIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
}
function FolderIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
}
function FileIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
}
function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
function StarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>;
}

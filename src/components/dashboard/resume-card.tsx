'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ResumeData {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  parsed_data?: {
    skills?: string[];
    contact?: {
      email?: string;
      phone?: string;
    };
  } | null;
  created_at: string;
  updated_at: string;
}

interface ResumeCardProps {
  resume: ResumeData | null;
  onUpdate?: () => void;
}

export function ResumeCard({ resume, onUpdate }: ResumeCardProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const supabase = createClient();

  const handleUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.warning('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('File must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete existing resume if any
      if (resume) {
        await supabase.storage.from('resumes').remove([resume.file_path]);
        await (supabase.from('resumes') as any).delete().eq('id', resume.id);
      }

      // Start both in parallel for maximum speed
      const fileName = `${user.id}/${Date.now()}-${file.name}`;

      const uploadPromise = supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      const dbPromise = (supabase.from('resumes') as any)
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: 'application/pdf',
          status: 'uploading',
          is_primary: true,
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

      const newResume = dbResult.data;

      // Parse the resume
      setParsing(true);
      setUploading(false);

      const parseResponse = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: newResume.id }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse resume');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [resume]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const skills = resume?.parsed_data?.skills || [];
  const isProcessing = uploading || parsing || resume?.status === 'parsing';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Resume</h3>
        {resume && resume.status === 'ready' && (
          <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            Replace
          </label>
        )}
      </div>

      <div className="p-4">
        {isProcessing ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Parsing resume...'}
            </p>
          </div>
        ) : resume && resume.status === 'ready' ? (
          <div>
            {/* File info */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <PdfIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{resume.file_name}</p>
                <p className="text-xs text-gray-500">
                  Updated {formatDate(resume.updated_at)}
                </p>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {skills.length} skills detected
                </p>
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 8 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{skills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Upload zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">
                Drop your resume here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse (PDF, max 10MB)
              </p>
            </label>
          </div>
        )}

        {resume?.status === 'error' && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              Failed to parse resume. Please try uploading again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

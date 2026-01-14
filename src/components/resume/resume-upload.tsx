'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setStatus('parsing');

      const parseResponse = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: uploadData.data.id }),
      });

      if (!parseResponse.ok) {
        const data = await parseResponse.json();
        throw new Error(data.error || 'Parsing failed');
      }

      setStatus('success');
      router.refresh();

      // Reset after success
      setTimeout(() => {
        setFile(null);
        setStatus('idle');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const handleRemove = () => {
    setFile(null);
    setStatus('idle');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400',
          (status === 'uploading' || status === 'parsing') && 'pointer-events-none opacity-50'
        )}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={status === 'uploading' || status === 'parsing'}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'rounded-full p-4',
            isDragActive ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <UploadIcon className={cn(
              'h-8 w-8',
              isDragActive ? 'text-blue-600' : 'text-gray-400'
            )} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              or click to browse (PDF only, max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Selected file */}
      {file && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-2">
              <FileIcon className="h-6 w-6 text-red-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {status === 'idle' && (
              <button
                onClick={handleRemove}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}

            {status === 'success' && (
              <CheckIcon className="h-6 w-6 text-green-500" />
            )}
          </div>

          {/* Progress */}
          {(status === 'uploading' || status === 'parsing') && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: status === 'uploading' ? '50%' : '90%' }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                {status === 'uploading' ? 'Uploading...' : 'Parsing resume...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload button */}
      {file && status === 'idle' && (
        <Button onClick={handleUpload} className="w-full">
          Upload Resume
        </Button>
      )}

      {/* Loading states */}
      {(status === 'uploading' || status === 'parsing') && (
        <Button disabled className="w-full">
          {status === 'uploading' ? 'Uploading...' : 'Parsing...'}
        </Button>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">Resume uploaded and parsed successfully!</p>
        </div>
      )}
    </div>
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

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LinkIcon, FileTextIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface JobImportFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (job: any) => void;
  initialUrl?: string;
  autoSubmit?: boolean;
}

type ImportMode = 'url' | 'text';

interface ImportResult {
  data: any;
  confidence: number;
  needs_review: boolean;
  delegated?: boolean;
}

export function JobImportForm({ open, onClose, onSuccess, initialUrl, autoSubmit }: JobImportFormProps) {
  const [mode, setMode] = useState<ImportMode>('url');
  const [url, setUrl] = useState(initialUrl || '');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [needsResumeSelection, setNeedsResumeSelection] = useState(false);
  const [availableResumes, setAvailableResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const router = useRouter();

  // Update URL if initialUrl changes
  useEffect(() => {
    if (initialUrl && open) {
      // If we get a new URL while the modal is open, reset state to handle it fresh
      if (initialUrl !== lastUrlRef.current) {
        lastUrlRef.current = initialUrl;
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }

        setUrl(initialUrl);
        setMode('url');
        setResult(null);
        setError('');
        setNeedsResumeSelection(false);
        setHasAutoSubmitted(false);
      }

      // Auto submit if requested and haven't yet for this specific session
      if (autoSubmit && !hasAutoSubmitted) {
        setHasAutoSubmitted(true);
        setTimeout(() => {
          handleImportWithUrl(initialUrl);
        }, 100);
      }
    }
  }, [initialUrl, open, autoSubmit]);

  // Reset session when modal closes
  useEffect(() => {
    if (!open) {
      setHasAutoSubmitted(false);
      lastUrlRef.current = null;
    }
  }, [open]);


  const resetForm = () => {
    setUrl('');
    setText('');
    setError('');
    setResult(null);
    setLoading(false);
    setMode('url');
    setNeedsResumeSelection(false);
    setAvailableResumes([]);
    setSelectedResumeId('');
    setExtractedData(null);
  };

  const handleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    resetForm();
    onClose();
  };

  const handleImportWithUrl = async (urlToImport: string) => {
    setLoading(true);
    setError('');
    setResult(null);
    setNeedsResumeSelection(false);

    try {
      const payload = { url: urlToImport };

      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        setError(`Server error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        console.error('Import API Error:', response.status, response.statusText, data);

        if (data.fallback === 'text') {
          setMode('text');
          setError(data.message || data.error);
          setLoading(false);
          return;
        }

        if (response.status === 409) {
          setError(`This job has already been imported: ${data.existing?.title} at ${data.existing?.company}`);
          setLoading(false);
          return;
        }

        const errorMsg = data.error || data.message || `Import failed (${response.status})`;
        const details = data.details ? `\n${data.details}` : '';
        setError(errorMsg + details);
        setLoading(false);
        return;
      }

      if (data.needs_resume_selection) {
        setNeedsResumeSelection(true);
        setAvailableResumes(data.available_resumes);
        setExtractedData(data.data);
        setLoading(false);
        return;
      }

      setResult({
        data: data.data,
        confidence: data.confidence,
        needs_review: data.needs_review,
        delegated: data.delegated,
      });

      router.refresh();
      onSuccess?.(data.data);
      // Store timeout so we can cancel it if needed
      closeTimeoutRef.current = setTimeout(() => handleClose(), 2000);
    } catch (e) {
      console.error('Import error:', e);
      setError(e instanceof Error ? e.message : 'Network error. Please check your connection and try again.');
    } finally {
      if (!needsResumeSelection) setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setNeedsResumeSelection(false);

    try {
      const payload = mode === 'url' ? { url } : { text };

      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        setError(`Server error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Log full error for debugging
        console.error('Import API Error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          url: mode === 'url' ? url : 'text mode',
        });

        // ... (existing error handling)
        if (data.fallback === 'text') {
          setMode('text');
          setError(data.message || data.error);
          setLoading(false);
          return;
        }

        if (response.status === 409) {
          setError(`This job has already been imported: ${data.existing?.title} at ${data.existing?.company}`);
          setLoading(false);
          return;
        }

        // Show more detailed error message
        const errorMsg = data.error || data.message || `Import failed (${response.status})`;
        const details = data.details ? `\n${data.details}` : '';
        setError(errorMsg + details);
        setLoading(false);
        return;
      }

      // Check if we need to select a resume
      if (data.needs_resume_selection) {
        setNeedsResumeSelection(true);
        setAvailableResumes(data.available_resumes);
        setExtractedData(data.data);
        setLoading(false);
        return;
      }

      // Success!
      setResult({
        data: data.data,
        confidence: data.confidence,
        needs_review: data.needs_review,
        delegated: data.delegated,
      });

      router.refresh();
      onSuccess?.(data.data);
      // Store timeout so we can cancel it if needed
      closeTimeoutRef.current = setTimeout(() => handleClose(), 2000);
    } catch (e) {
      console.error('Import error:', e);
      setError(e instanceof Error ? e.message : 'Network error. Please check your connection and try again.');
    } finally {
      if (!needsResumeSelection) setLoading(false);
    }
  };

  const handleFinalizeDelegate = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: extractedData.job_url,
          text: extractedData.description,
          resume_id: selectedResumeId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delegate');

      setResult({
        data: data.data,
        confidence: data.confidence,
        needs_review: data.needs_review,
        delegated: data.delegated,
      });

      router.refresh();

      // Store timeout so we can cancel it if needed
      closeTimeoutRef.current = setTimeout(() => handleClose(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delegate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidInput = mode === 'url'
    ? url.trim().length > 0 && url.startsWith('http')
    : text.trim().length >= 50;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {needsResumeSelection ? 'Select Resume for Delegation' : 'Import Job from URL'}
          </DialogTitle>
          <DialogDescription>
            {needsResumeSelection
              ? `We found ${availableResumes.length} resumes. Which one should we use for ${extractedData?.company}?`
              : 'Paste a job posting URL from LinkedIn, Indeed, Glassdoor, Jobright.ai, or any career page.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {result.delegated ? 'Delegated to VA!' : 'Job Imported!'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {result.data.title} at {result.data.company}
            </p>
            {result.delegated && (
              <p className="mt-2 text-sm text-purple-600 font-medium whitespace-pre-line">
                Resume assigned. Ready for VA to apply.{"\n"}
                (This resume is now your default)
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${result.confidence >= 80 ? 'bg-green-100 text-green-700' : result.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                }`}>
                {result.confidence || 0}%
              </span>
            </div>
            {result.confidence < 50 && (
              <p className="mt-2 text-xs text-gray-500 max-w-sm mx-auto">
                ℹ️ Limited details extracted. The VA can view the full job posting via the URL.
              </p>
            )}
          </div>
        ) : needsResumeSelection ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-bold text-slate-900">{extractedData?.title}</p>
              <p className="text-xs text-slate-500">{extractedData?.company}</p>
            </div>
            <div className="space-y-2">
              <Label>Choose a Resume</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableResumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setSelectedResumeId(resume.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedResumeId === resume.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">{resume.job_role || resume.title}</p>
                      <p className="text-[10px] text-slate-500">{resume.file_name}</p>
                    </div>
                    {selectedResumeId === resume.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setNeedsResumeSelection(false)} className="flex-1">Back</Button>
              <Button onClick={handleFinalizeDelegate} disabled={loading || !selectedResumeId} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Delegate'}
              </Button>
            </div>
          </div>
        ) : (loading && hasAutoSubmitted && !needsResumeSelection) ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <Loader2 className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Initiating Delegation...</h3>
              <p className="text-sm text-slate-500 font-medium">Deploying Job Application Kit</p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-600 h-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex rounded-lg border bg-gray-50 p-1">
              <button type="button" onClick={() => setMode('url')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><LinkIcon className="h-4 w-4" />URL</button>
              <button type="button" onClick={() => setMode('text')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileTextIcon className="h-4 w-4" />Paste Text</button>
            </div>
            {mode === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="import-url">Job Posting URL</Label>
                <Input id="import-url" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
              </div>
            )}
            {mode === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="import-text">Job Description</Label>
                <Textarea id="import-text" placeholder="Paste text here..." value={text} onChange={(e) => setText(e.target.value)} rows={8} disabled={loading} />
              </div>
            )}
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">Cancel</Button>
              <Button onClick={handleImport} disabled={loading || !isValidInput} className="flex-1">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Job'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

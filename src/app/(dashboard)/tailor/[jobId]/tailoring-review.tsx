'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';


interface Job {
  id: string;
  title: string;
  company: string;
  description: string | null;
  status: string;
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  tailored_bullets?: string[];
}

interface OriginalResume {
  skills?: string[];
  experience?: Experience[];
  summary?: string;
}

interface TailoredResume {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  tailored_summary?: string;
  tailored_experience?: Experience[];
  tailored_skills?: string[];
  full_tailored_data?: {
    summary?: string;
    experience?: Experience[];
    highlighted_skills?: string[];
    keywords_matched?: string[];
    keywords_missing?: string[];
    match_score?: number;
  };
}

interface FeatureAccess {
  cover_letter_enabled: boolean;
  resume_tailor_enabled: boolean;
}

interface TailoringReviewProps {
  job: Job;
  originalResume: OriginalResume | null;
  initialTailoredResume: TailoredResume | null;
  userId: string;
}

export function TailoringReview({
  job,
  originalResume,
  initialTailoredResume,
  userId,
}: TailoringReviewProps) {
  const router = useRouter();
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(initialTailoredResume);
  const [isPolling, setIsPolling] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [editedExperience, setEditedExperience] = useState<Experience[]>([]);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // Fetch user's feature access on mount
  useEffect(() => {
    const fetchFeatureAccess = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setFeatureAccess(data.data?.feature_access || { cover_letter_enabled: false, resume_tailor_enabled: false });
        }
      } catch (error) {
        console.error('Error fetching feature access:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };
    fetchFeatureAccess();
  }, []);

  // Keywords from job description for highlighting
  const keywords = tailoredResume?.full_tailored_data?.keywords_matched || [];

  // Initialize edited content when tailored resume loads
  useEffect(() => {
    if (tailoredResume?.status === 'completed') {
      setEditedSummary(tailoredResume.tailored_summary || '');
      setEditedExperience(tailoredResume.tailored_experience || []);
    }
  }, [tailoredResume]);

  // Poll for updates when processing (with exponential backoff)
  useEffect(() => {
    if (!tailoredResume || tailoredResume.status === 'completed' || tailoredResume.status === 'failed') {
      setIsPolling(false);
      return;
    }

    if (tailoredResume.status === 'pending' || tailoredResume.status === 'processing') {
      setIsPolling(true);
      let pollCount = 0;
      let timeoutId: NodeJS.Timeout;

      const poll = async () => {
        try {
          const response = await fetch(`/api/tailor?job_id=${job.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              setTailoredResume(data.data);
              if (data.data.status === 'completed' || data.data.status === 'failed') {
                setIsPolling(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }

        // Exponential backoff: 1s, 2s, 3s, 4s, 5s (max 5s)
        pollCount++;
        const nextInterval = Math.min(1000 * pollCount, 5000);
        timeoutId = setTimeout(poll, nextInterval);
      };

      // Start polling after 1 second
      timeoutId = setTimeout(poll, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [tailoredResume?.status, job.id]);

  // Trigger tailoring with direct mode for faster response
  const handleTriggerTailoring = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, mode: 'direct' }),
      });

      if (response.ok) {
        const data = await response.json();

        // Direct mode returns completed immediately
        if (data.data?.status === 'completed') {
          setTailoredResume({
            id: data.data.id,
            status: 'completed',
            tailored_summary: data.data.tailored?.summary,
            tailored_experience: data.data.tailored?.experience,
            tailored_skills: data.data.tailored?.highlighted_skills,
            full_tailored_data: data.data.tailored,
          } as TailoredResume);
        } else {
          // Queue mode - will need to poll
          setTailoredResume({
            id: data.data.id,
            status: 'pending',
          } as TailoredResume);
        }
      }
    } catch (error) {
      console.error('Error triggering tailoring:', error);
    } finally {
      setTriggering(false);
    }
  };

  // Save edits
  const handleSaveEdits = async () => {
    if (!tailoredResume) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/tailor/${tailoredResume.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailored_summary: editedSummary,
          tailored_experience: editedExperience,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving edits:', error);
    } finally {
      setSaving(false);
    }
  };

  // Download as PDF
  const handleDownloadPDF = () => {
    if (!tailoredResume) return;

    const doc = new jsPDF();
    const summary = editedSummary || tailoredResume.tailored_summary || '';
    const experience = editedExperience.length > 0 ? editedExperience : tailoredResume.tailored_experience || [];

    // Title
    doc.setFontSize(20);
    doc.text(originalResume?.experience?.[0]?.title || 'Professional Resume', 20, 20);
    doc.setFontSize(10);
    doc.text(`Targeting: ${job.title} at ${job.company}`, 20, 28);

    // Summary
    doc.setFontSize(14);
    doc.text('Professional Summary', 20, 40);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(summary, 170);
    doc.text(splitSummary, 20, 48);

    // Experience
    let yPos = 48 + (splitSummary.length * 5) + 10;

    doc.setFontSize(14);
    doc.text('Work Experience', 20, yPos);
    yPos += 8;

    experience.forEach((exp) => {
      // Check page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.title, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${exp.company} | ${exp.startDate || ''} - ${exp.endDate || 'Present'}`, 20, yPos + 5);

      yPos += 10;
      doc.setFontSize(10);

      const bullets = exp.tailored_bullets || [];
      bullets.forEach((bullet) => {
        const bulletText = `• ${bullet}`;
        const splitBullet = doc.splitTextToSize(bulletText, 165);

        if (yPos + (splitBullet.length * 5) > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(splitBullet, 25, yPos);
        yPos += (splitBullet.length * 5) + 2;
      });

      yPos += 5;
    });

    doc.save(`Tailored_Resume_${job.company.replace(/\s+/g, '_')}.pdf`);
    toast.success('Resume downloaded as PDF');
  };

  // Download as DOCX
  const handleDownloadDOCX = async () => {
    if (!tailoredResume) return;

    const summary = editedSummary || tailoredResume.tailored_summary || '';
    const experience = editedExperience.length > 0 ? editedExperience : tailoredResume.tailored_experience || [];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: originalResume?.experience?.[0]?.title || "Professional Resume",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Targeting: ${job.title} at ${job.company}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "Professional Summary",
            heading: HeadingLevel.HEADING_2,
            style: "Heading 2", // Standard style name
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun(summary)],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "Work Experience",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          ...experience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.title,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${exp.company} | ${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...(exp.tailored_bullets || []).map(bullet =>
              new Paragraph({
                text: bullet,
                bullet: {
                  level: 0
                }
              })
            )
          ])
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Resume_${job.company.replace(/\s+/g, '_')}.docx`);
    toast.success('Resume downloaded as DOCX');
  };

  // Confirm and send to VA
  const handleConfirmAndSend = async () => {
    if (!tailoredResume) return;
    setSaving(true);

    try {
      // Step 1: Create application record (this will appear in admin dashboard)
      const applicationResponse = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          status: 'draft',
          cover_letter: editedSummary,
        }),
      });

      if (!applicationResponse.ok) {
        throw new Error('Failed to create application task');
      }

      // Step 2: Update job status to 'applied'
      const jobResponse = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          status: 'applied',
        }),
      });

      if (jobResponse.ok) {
        router.push('/jobs');
        router.refresh();
      }
    } catch (error) {
      console.error('Error confirming:', error);
      toast.error('Failed to send to VA. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update a specific experience bullet
  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newText: string) => {
    const updated = [...editedExperience];
    if (updated[expIndex]?.tailored_bullets) {
      updated[expIndex].tailored_bullets![bulletIndex] = newText;
      setEditedExperience(updated);
    }
  };

  // Highlight keywords in text
  const highlightKeywords = (text: string) => {
    if (!keywords.length) return text;

    let result = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      result = result.replace(regex, '{{HIGHLIGHT}}$1{{/HIGHLIGHT}}');
    });

    return result.split('{{HIGHLIGHT}}').map((part, i) => {
      if (part.includes('{{/HIGHLIGHT}}')) {
        const [highlighted, rest] = part.split('{{/HIGHLIGHT}}');
        return (
          <span key={i}>
            <span className="bg-green-200 text-green-900 px-0.5 rounded font-medium">
              {highlighted}
            </span>
            {rest}
          </span>
        );
      }
      return part;
    });
  };

  // No resume data
  if (!originalResume) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Please upload and parse your resume first.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No tailored resume yet - offer to start (if feature is enabled)
  if (!tailoredResume) {
    // Check if feature is enabled
    if (!loadingFeatures && !featureAccess?.resume_tailor_enabled) {
      return (
        <div className="space-y-6">
          <JobHeader job={job} />
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Resume Tailoring Not Available</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                The AI Resume Tailoring feature is not enabled for your account. Please contact support to enable this feature.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <JobHeader job={job} />
        <Card>
          <CardContent className="py-12 text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-blue-500" />
            <h3 className="mt-4 text-lg font-semibold">Ready to Tailor Your Resume</h3>
            <p className="mt-2 text-gray-500">
              Our AI will customize your resume to match this job description.
            </p>
            <Button
              className="mt-6"
              onClick={handleTriggerTailoring}
              disabled={triggering || loadingFeatures}
            >
              {triggering ? 'Starting...' : 'Start AI Tailoring'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state
  if (tailoredResume.status === 'pending' || tailoredResume.status === 'processing') {
    return (
      <div className="space-y-6">
        <JobHeader job={job} />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-pulse">
                <SparklesIcon className="h-16 w-16 text-blue-500 animate-bounce" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Magic is happening...
              </h3>
              <p className="mt-2 text-gray-500">
                Our AI is tailoring your resume for {job.company}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mt-8 mx-auto max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress"
                  style={{ width: tailoredResume.status === 'processing' ? '70%' : '30%' }}
                />
              </div>
              <p className="mt-3 text-center text-sm text-gray-500">
                {tailoredResume.status === 'pending' ? 'Queued...' : 'Analyzing job requirements...'}
              </p>
            </div>

            {/* Tips while waiting */}
            <div className="mt-8 mx-auto max-w-md rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>Did you know?</strong> Tailored resumes are 3x more likely to get past ATS systems.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed state
  if (tailoredResume.status === 'failed') {
    return (
      <div className="space-y-6">
        <JobHeader job={job} />
        <Card>
          <CardContent className="py-12 text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold text-red-700">Tailoring Failed</h3>
            <p className="mt-2 text-gray-500">
              {tailoredResume.error_message || 'Something went wrong. Please try again.'}
            </p>
            <Button
              className="mt-6"
              onClick={handleTriggerTailoring}
              disabled={triggering}
            >
              {triggering ? 'Retrying...' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed - show diff view
  const tailoredData = tailoredResume.full_tailored_data;

  return (
    <div className="space-y-6">
      <JobHeader job={job} />

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="success">AI Tailored</Badge>
          {keywords.length > 0 && (
            <span className="text-sm text-gray-500">
              {keywords.length} keywords matched
            </span>
          )}
        </div>

        {/* Score & Actions */}
        <div className="flex gap-2 items-center">
          {tailoredData?.match_score && (
            <div className="flex items-center gap-2 mr-4 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">ATS Score</span>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2",
                tailoredData.match_score >= 75 ? "border-green-500 text-green-700 bg-green-50" :
                  tailoredData.match_score >= 50 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                    "border-red-500 text-red-700 bg-red-50"
              )}>
                {tailoredData.match_score}
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleDownloadPDF} title="Download as PDF">
            <FileTextIcon className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadDOCX} title="Download as DOCX">
            <FileWordIcon className="mr-2 h-4 w-4" />
            DOCX
          </Button>

          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdits} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleConfirmAndSend} disabled={saving}>
                <CheckIcon className="mr-2 h-4 w-4" />
                {saving ? 'Sending...' : 'Confirm & Send to VA'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Matched Keywords */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Matched Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, i) => (
                <Badge key={i} variant="success" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Keywords Warning */}
      {tailoredData?.keywords_missing && tailoredData.keywords_missing.length > 0 && (
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="pb-3 text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              <CardTitle className="text-sm font-semibold">Missing Critical Keywords</CardTitle>
            </div>
            <CardDescription className="text-red-700/80 text-xs">
              These important keywords from the JD were NOT found in your resume. Consider adding them if you have these skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tailoredData.keywords_missing.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Diff */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
          <CardDescription>Your summary tailored to highlight relevant experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Original */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Original</p>
              <p className="text-sm text-gray-700">
                {originalResume.summary || 'No summary in original resume'}
              </p>
            </div>

            {/* Tailored */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-green-600">AI Tailored</p>
              {editMode ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={4}
                  className="bg-white"
                />
              ) : (
                <p className="text-sm text-gray-700">
                  {highlightKeywords(tailoredData?.summary || tailoredResume.tailored_summary || '')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Diff */}
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Experience bullets rewritten to match job requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(tailoredData?.experience || tailoredResume.tailored_experience || []).map((exp, expIndex) => {
            const originalExp = originalResume.experience?.[expIndex];
            const editedExp = editedExperience[expIndex];

            return (
              <div key={expIndex} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                  <p className="text-sm text-gray-600">
                    {exp.company} {exp.location && `• ${exp.location}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Original bullets */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase text-gray-500">Original</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {originalExp?.description || 'No description'}
                    </p>
                  </div>

                  {/* Tailored bullets */}
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase text-green-600">AI Tailored</p>
                    {editMode ? (
                      <div className="space-y-2">
                        {(editedExp?.tailored_bullets || exp.tailored_bullets || []).map((bullet, bulletIndex) => (
                          <Textarea
                            key={bulletIndex}
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)}
                            rows={2}
                            className="bg-white text-sm"
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {(exp.tailored_bullets || []).map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="text-sm text-gray-700 flex">
                            <span className="mr-2 text-green-500">•</span>
                            <span>{highlightKeywords(bullet)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Highlighted Skills */}
      {tailoredData?.highlighted_skills && tailoredData.highlighted_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills to Highlight</CardTitle>
            <CardDescription>These skills from your resume match the job requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tailoredData.highlighted_skills.map((skill, i) => (
                <Badge key={i} variant="info">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Job Header Component
function JobHeader({ job }: { job: Job }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
        <p className="text-lg text-gray-600">{job.company}</p>
      </div>
      <Badge className={cn(
        job.status === 'pending' && 'bg-yellow-100 text-yellow-700',
        job.status === 'tailored' && 'bg-blue-100 text-blue-700',
        job.status === 'applied' && 'bg-green-100 text-green-700',
      )}>
        {job.status}
      </Badge>
    </div>
  );
}

// Icons
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function FileWordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h2" />
      <path d="M8 17h2" />
      <path d="M14 13h2" />
      <path d="M14 17h2" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

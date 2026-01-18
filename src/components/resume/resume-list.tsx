'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Database } from '@/types/database.types';

type Resume = Database['public']['Tables']['resumes']['Row'];

// Use consistent date format to avoid hydration mismatch
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ResumeListProps {
  resumes: Resume[];
}

const statusColors: Record<string, string> = {
  uploading: 'bg-yellow-100 text-yellow-700',
  parsing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export function ResumeList({ resumes }: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No resumes uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <Card key={resume.id}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-red-100 p-2">
              <FileIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {resume.title || resume.file_name}
              </p>
              <p className="text-xs text-gray-500">
                {(resume.file_size / 1024 / 1024).toFixed(2)} MB
                {' • '}
                {formatDate(resume.created_at)}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[resume.status]}`}>
              {resume.status}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
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

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumePreviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the resume
  const { data: resume, error } = await (supabase
    .from('resumes') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !resume) {
    notFound();
  }

  // Get download URL
  const { data: urlData } = await supabase.storage
    .from('resumes')
    .createSignedUrl(resume.file_path, 3600); // 1 hour expiry

  const downloadUrl = urlData?.signedUrl;
  const parsedData = resume.parsed_data || {};
  const skills = parsedData.skills || [];
  const contact = parsedData.contact || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {resume.job_role || resume.title || 'Resume Preview'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{resume.file_name}</p>
            </div>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={resume.file_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              resume.status === 'ready'
                ? 'bg-green-100 text-green-700'
                : resume.status === 'parsing'
                ? 'bg-yellow-100 text-yellow-700'
                : resume.status === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {resume.status === 'ready' ? 'Parsed' : resume.status}
            </span>
            <span className="text-sm text-gray-500">
              Uploaded {new Date(resume.created_at).toLocaleDateString()}
            </span>
            {resume.file_size && (
              <span className="text-sm text-gray-500">
                {(resume.file_size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        {/* Extracted Contact Info */}
        {(contact.email || contact.phone || contact.linkedin || contact.github) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {contact.email && (
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2 text-gray-900">{contact.phone}</span>
                </div>
              )}
              {contact.linkedin && (
                <div>
                  <span className="text-gray-500">LinkedIn:</span>
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                    {contact.linkedin}
                  </a>
                </div>
              )}
              {contact.github && (
                <div>
                  <span className="text-gray-500">GitHub:</span>
                  <a href={contact.github} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                    {contact.github}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              Detected Skills ({skills.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parsed Text */}
        {resume.parsed_text && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Extracted Text</h2>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                {resume.parsed_text}
              </pre>
            </div>
          </div>
        )}

        {/* PDF Preview */}
        {downloadUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">PDF Preview</h2>
            <div className="aspect-[8.5/11] bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`${downloadUrl}#toolbar=0`}
                className="w-full h-full"
                title="Resume PDF Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

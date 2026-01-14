import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';

interface ParseResponse {
  success: boolean;
  data?: {
    id: string;
    text: string;
    numPages: number;
    parsedData: Record<string, unknown>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get resume ID from request body
    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Fetch resume record
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Update status to parsing
    await supabase
      .from('resumes')
      .update({ status: 'parsing' })
      .eq('id', resumeId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from('resumes')
        .update({ status: 'error', error_message: 'Failed to download file' })
        .eq('id', resumeId);

      return NextResponse.json(
        { success: false, error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Convert blob to buffer and parse PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (parseError) {
      await supabase
        .from('resumes')
        .update({ status: 'error', error_message: 'Failed to parse PDF' })
        .eq('id', resumeId);

      console.error('PDF parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse PDF content' },
        { status: 500 }
      );
    }

    // Extract structured data
    const parsedData = extractResumeData(pdfData.text);

    // Update resume record with parsed content
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        parsed_text: pdfData.text,
        parsed_data: parsedData,
        status: 'ready',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', resumeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save parsed content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resumeId,
        text: pdfData.text,
        numPages: pdfData.numpages,
        parsedData,
      },
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract structured data from resume text
function extractResumeData(text: string): Record<string, unknown> {
  const lines = text.split('\n').filter(line => line.trim());

  // Basic extraction patterns
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const linkedin = text.match(linkedinRegex) || [];
  const github = text.match(githubRegex) || [];

  // Common skill keywords
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
    'GraphQL', 'REST', 'SQL', 'NoSQL', 'Git', 'CI/CD', 'Agile', 'Scrum',
    'HTML', 'CSS', 'Tailwind', 'SASS', 'Machine Learning', 'AI', 'Data Science',
  ];

  const detectedSkills = skillKeywords.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return {
    contact: {
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
      linkedin: linkedin[0] ? `https://${linkedin[0]}` : null,
      github: github[0] ? `https://${github[0]}` : null,
    },
    skills: detectedSkills,
    wordCount: text.split(/\s+/).length,
    lineCount: lines.length,
    extractedAt: new Date().toISOString(),
  };
}

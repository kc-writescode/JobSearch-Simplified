import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import pdfParse from 'pdf-parse';
import { openai } from '@/lib/ai/openai';

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
    const { data: resume, error: fetchError } = await (supabase.from('resumes') as any)
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single() as { data: { file_path: string } | null; error: any };

    if (fetchError || !resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Update status to parsing
    await (supabase.from('resumes') as any)
      .update({ status: 'parsing' })
      .eq('id', resumeId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.file_path);

    if (downloadError || !fileData) {
      await (supabase.from('resumes') as any)
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
      await (supabase.from('resumes') as any)
        .update({ status: 'error', error_message: 'Failed to parse PDF' })
        .eq('id', resumeId);

      console.error('PDF parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse PDF content' },
        { status: 500 }
      );
    }

    // Extract structured data using AI
    let parsedData;
    try {
      parsedData = await extractResumeDataWithAI(pdfData.text);
    } catch (aiError) {
      console.error('AI Parse error:', aiError);
      // Fallback or keep it as error
      await (supabase.from('resumes') as any)
        .update({ status: 'error', error_message: 'AI Parsing failed' })
        .eq('id', resumeId);

      return NextResponse.json(
        { success: false, error: 'AI Parsing failed' },
        { status: 500 }
      );
    }

    // Update resume record with parsed content
    const { error: updateError } = await (supabase.from('resumes') as any)
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

async function extractResumeDataWithAI(text: string): Promise<Record<string, unknown>> {
  const systemPrompt = `You are an expert resume parser. Extract the information from the provided resume text into a structured JSON format.
  
  Format the response as JSON with this structure:
  {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin_url": "string",
    "portfolio_url": "string",
    "summary": "string",
    "skills": [
      { "category": "Technical", "items": ["Skill 1", "Skill 2"] }
    ],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "location": "string",
        "start_date": "string",
        "end_date": "string",
        "description": ["Bullet point 1", "Bullet point 2"]
      }
    ],
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "field": "string",
        "location": "string",
        "start_date": "string",
        "end_date": "string",
        "gpa": "string"
      }
    ],
    "projects": [
      {
        "name": "string",
        "description": "string",
        "technologies": ["tech1", "tech2"],
        "link": "string"
      }
    ]
  }
  
  Guidelines:
  - Normalize dates to a readable format (e.g., "Month Year" or "Year").
  - For experience descriptions, break the content into a list of meaningful bullet points.
  - Categorize skills logically.
  - If a piece of information is missing, use an empty string or null.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text.slice(0, 8000) }, // Limit text to avoid token limits
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('AI failed to parse resume');

  return JSON.parse(content);
}

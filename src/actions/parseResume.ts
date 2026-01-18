'use server';

import { createClient } from '@/lib/supabase/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export interface ParsedResume {
  skills: string[];
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  education: {
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
  }[];
  contact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    location?: string;
  };
  summary?: string;
}

export interface ParseResumeResult {
  success: boolean;
  data?: ParsedResume;
  error?: string;
}

export async function parseResumeById(resumeId: string): Promise<ParseResumeResult> {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get resume record from database
    const { data: resume, error: resumeError } = await (supabase
      .from('resumes') as any)
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      return { success: false, error: 'Resume not found' };
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.file_path);

    if (downloadError || !fileData) {
      return { success: false, error: 'Failed to download resume file' };
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (parseError) {
      console.error('PDF parse error:', parseError);
      return { success: false, error: 'Failed to parse PDF content' };
    }

    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return { success: false, error: 'Could not extract sufficient text from PDF' };
    }

    // Use OpenAI to extract structured data
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Extract structured information from the resume text and return it as JSON.

Return ONLY valid JSON with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "Brief description of role"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "City, State",
      "graduationDate": "MM/YYYY",
      "gpa": "X.XX"
    }
  ],
  "contact": {
    "email": "email@example.com",
    "phone": "123-456-7890",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "location": "City, State"
  },
  "summary": "Brief professional summary"
}

Extract as much information as available. Use null for missing fields. Return ONLY the JSON, no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Parse this resume:\n\n${resumeText.substring(0, 8000)}`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, error: 'Failed to get response from AI' };
    }

    let parsedResume: ParsedResume;
    try {
      parsedResume = JSON.parse(responseContent);
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return { success: false, error: 'Failed to parse AI response' };
    }

    // Save parsed resume data to profiles table
    const updateData = {
      resume_data: parsedResume,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: 'Failed to save parsed resume' };
    }

    // Update resume record with parsed data and status
    await (supabase.from('resumes') as any)
      .update({
        parsed_data: parsedResume,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId);

    return {
      success: true,
      data: parsedResume,
    };
  } catch (error) {
    console.error('Parse resume error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

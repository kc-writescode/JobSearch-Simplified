import { getOpenAI } from '../ai/openai';
import { createClient } from '@/lib/supabase/client'; // Note: server side needs service role usually

export interface TailoredExperience {
    company: string;
    role: string;
    title?: string;
    startDate: string;
    endDate: string;
    start_date?: string;
    end_date?: string;
    tailored_bullets: string[];
}

export interface TailoredData {
    match_score: number;
    keywords_matched: string[];
    keywords_missing: string[];
    summary: string;
    experience: TailoredExperience[];
    highlighted_skills: string[];
}

export async function tailorWithOpenAI(
    resumeText: string,
    jobDescription: string,
    currentExperience: any[]
): Promise<TailoredData> {
    const openai = getOpenAI();

    const prompt = `
    You are an expert career coach and professional resume writer. Your task is to tailor a candidate's resume content to perfectly align with a specific job description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    CANDIDATE RESUME TEXT:
    ${resumeText}
    
    Your goal is to:
    1. Analyze the job description for key requirements, skills, and values.
    2. Review the candidate's resume text.
    3. Generate a match score (0-100) based on how well they fit the role.
    4. Identify keywords from the job description that the candidate HAS (matched) and keywords they SHOULD HAVE but aren't prominent (missing).
    5. Rewrite the professional summary to be compelling and highlight the most relevant experience for THIS specific role.
    6. Review the candidate's work history and rewrite bullet points to emphasize relevant achievements and skills mentioned in the job description, while staying truthful to the original experience.
    7. Select the top 15-20 skills that are most relevant for this role from the candidate's profile.

    IMPORTANT: You MUST return a valid JSON object following this exact structure:
    {
      "match_score": number,
      "keywords_matched": string[],
      "keywords_missing": string[],
      "summary": string,
      "experience": [
        {
          "company": string,
          "role": string,
          "startDate": string,
          "endDate": string,
          "tailored_bullets": string[]
        }
      ],
      "highlighted_skills": string[]
    }

    The "experience" array should correspond to these specific roles:
    ${JSON.stringify(currentExperience.map(e => ({ company: e.company_name || e.company, role: e.job_title || e.role })))}

    Make sure the tailored_bullets are impactful, start with strong action verbs, and quantify achievements where possible.
  `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a professional resume tailoring assistant. You output ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('OpenAI failed to generate content');

    return JSON.parse(content) as TailoredData;
}

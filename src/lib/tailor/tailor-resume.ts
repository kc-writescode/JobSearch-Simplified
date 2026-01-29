import { getGeminiModel } from '@/lib/ai/gemini';
import { ResumeData, ResumeExperience } from '@/types/resume';

export interface TailoredExperience extends Partial<ResumeExperience> {
  tailored_bullets: string[];
}

export interface TailoredResult {
  summary: string;
  experience: TailoredExperience[];
  highlighted_skills: string[];
  keywords_matched: string[];
  keywords_missing: string[];
  match_score: number;
}

// ... (imports remain the same)

export async function tailorResumeWithAI(
  resumeData: ResumeData,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<TailoredResult> {
  const systemPrompt = `You are an expert Resume Strategist and ATS (Applicant Tracking System) Optimization Specialist. Your goal is to rewrite a candidate's resume to strictly align with a target Job Description (JD) while adhering to industry best practices.

  INPUTS:
  1. Master Resume (JSON)
  2. Target Job Description (Text)

  YOUR OBJECTIVES:
  1. **Strategic Refinement**: Select the most relevant experience from the Master Resume that matches the JD.
  2. **Bullet Point Optimization (STAR Method)**: Rewrite bullet points to be action-oriented, result-driven, and quantifiable. Use the STAR method (Situation, Task, Action, Result) where possible.
     - Start with strong action verbs (e.g., "Orchestrated", "Engineered", "Optimized" vs. "Helped", "Worked on").
     - Incorporate metrics (%, $, time saved) if present in the original data or reasonably inferable from context (do NOT invent numbers).
  3. **ATS Keyword Optimization**:
     - Identify high-value keywords (hard skills, tools, methodologies) from the JD.
     - Naturally weave these keywords into the summary and bullet points.
  4. **Gap Analysis & Scoring**:
     - Calculate an ATS Match Score (0-100) based on skill overlap and relevance.
     - Identify specific high-priority keywords from the JD that are MISSING in the resume.

  OUTPUT FORMAT (Strict JSON):
  {
    "summary": "Values-driven professional summary (3-4 lines) tailored to the role, emphasizing key matches.",
    "experience": [
      {
        "company": "Company Name",
        "role": "Role Title",
        "location": "Location",
        "start_date": "Date",
        "end_date": "Date",
        "tailored_bullets": [
          "Strong Action Verb + Context + ONE specific keyword/skill + Result/Impact.",
          "Strong Action Verb + Achievement + quantifiable metric."
        ]
      }
    ],
    "highlighted_skills": ["Top 5-8 hard skills present in the resume that match the JD"],
    "keywords_matched": ["List of JD keywords effectively included in the tailored resume"],
    "keywords_missing": ["List of CRITICAL JD keywords NOT found in the Master Resume (do not hallucinate these into the resume)"],
    "match_score": 85 // Integer 0-100. <60: Poor, 60-75: Good, 75-90: Strong, >90: Excellent
  }

  CONSTRAINTS & RULES:
  - **NO HALLUCINATIONS**: Do not invent skills, experiences, or degrees not present in the Master Resume. If a critical skill is missing, list it in "keywords_missing".
  - **optimize for legibility**: Bullets should be 1-2 lines max.
  - **Tone**: Professional, confident, active voice.
  - **Experience Filtration**: If the Master Resume has many roles, prioritize the most recent and relevant ones. You may omit irrelevant early career roles or shorten them significantly.
  `;

  const userPrompt = `TARGET JOB: ${jobTitle} at ${company}
  
  JOB DESCRIPTION:
  ${jobDescription.slice(0, 4000)}
  
  MASTER RESUME DATA:
  ${JSON.stringify(resumeData, null, 2)}`;

  const model = getGeminiModel('gemini-flash-latest');

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    }
  });

  const responseContent = result.response.text();
  if (!responseContent) {
    throw new Error('No response from AI');
  }

  const tailoredData = JSON.parse(responseContent);

  return {
    summary: tailoredData.summary || '',
    experience: tailoredData.experience || [],
    highlighted_skills: tailoredData.highlighted_skills || [],
    keywords_matched: tailoredData.keywords_matched || [],
    keywords_missing: tailoredData.keywords_missing || [],
    match_score: typeof tailoredData.match_score === 'number' ? tailoredData.match_score : parseInt(String(tailoredData.match_score)) || 0,
  };
}

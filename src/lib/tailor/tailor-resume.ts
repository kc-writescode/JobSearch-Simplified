import { openai } from '@/lib/ai/openai';
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

export async function tailorResumeWithAI(
  resumeData: ResumeData,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<TailoredResult> {
  const systemPrompt = `You are an expert resume writer and ATS optimizer. Tailor the resume for the specific job and provide match intelligence.
  
  You will be provided with a "Master Resume" in JSON format and a target Job Description.
  
  YOUR TASK:
  1. Select and refine the most relevant experiences from the Master Resume.
  2. Rewrite bullet points to highlight skills mentioned in the job description using quantifiable achievements.
  3. Perform Match Analytics:
     - keywords_matched: Specific skills/tools from the JD that ARE in the tailored resume.
     - keywords_missing: Important skills/tools from the JD that ARE NOT in your tailored version (because they weren't in the Master Resume).
     - match_score: A realistic 0-100 score of how well the tailored resume matches the target JD.
  
  Return JSON with this exact structure:
  {
    "summary": "2-3 sentence tailored summary",
    "experience": [
      {
        "company": "Company Name",
        "role": "Role",
        "location": "Location",
        "start_date": "Date",
        "end_date": "Date",
        "tailored_bullets": ["Bullet 1", "Bullet 2"]
      }
    ],
    "highlighted_skills": ["skill1", "skill2"],
    "keywords_matched": ["keyword1", "keyword2"],
    "keywords_missing": ["missing_keyword1", "missing_keyword2"],
    "match_score": 85
  }
  
  Rule:
  - DO NOT invent facts. If a skill is missing from the Master Resume, include it in "keywords_missing" and DO NOT put it in the resume.
  - Return 3-5 high-impact bullets per role.
  - Highlight 5-10 most relevant skills.
  - LINE DENSITY OPTIMIZATION: Ensure each bullet point is either a single concise line or fills at least 60% of the second line. Avoid "widows" (bullets where the last line has only 1-4 words). If a bullet has a widow, rewrite it by adding meaningful detail or trimming it to fit perfectly.`;

  const userPrompt = `TARGET JOB: ${jobTitle} at ${company}
  
  JOB DESCRIPTION:
  ${jobDescription.slice(0, 3000)}
  
  MASTER RESUME DATA:
  ${JSON.stringify(resumeData, null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;
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

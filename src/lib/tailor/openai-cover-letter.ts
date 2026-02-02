import { getOpenAI } from '../ai/openai';

export async function generateCoverLetterWithOpenAI(
    candidateName: string,
    resumeText: string,
    jobDescription: string,
    clientNotes: string,
    globalInstructions: string
): Promise<string> {
    const openai = getOpenAI();

    const prompt = `
    You are an elite Executive Career Strategist. Your goal is to write a cover letter that matches the candidate's specific background to the job requirements with precision, sounding completely human and high-impact.

    CANDIDATE NAME:
    ${candidateName}
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    CANDIDATE RESUME:
    ${resumeText}
    
    CLIENT SPECIFIC NOTES:
    ${clientNotes}
    
    GLOBAL STYLE INSTRUCTIONS:
    ${globalInstructions}
    
    TASK:
    Write a high-impact, professional cover letter that bridges the candidate's actual experience with the specific needs of this role.
    
    CRITICAL HUMAN-CENTRIC WRITING RULES:
    1. **QUANTIFY IMPACT:** Whenever possible, use specific numbers, percentages, or scale (e.g., "managed $5M budget," "reduced latency by 40%") from the resume to prove competence. Do not just list skills; prove them with data.
    2. **DEEP MATCHING:** Don't just generically say "I fit this role." Explicitly connect a specific requirement in the Job Description to a specific achievement in the Resume. Show you read the job post.
    3. **SOUND HUMAN:** 
       - ABSOLUTELY NO "AI-ISMS" like "I am writing to express my interest," "thrilled to apply," "passionate about," "woven together," "testament to," or "unique blend of."
       - Use conversational but professional transitions.
       - Vary sentence length. One-word or short sentences can be powerful.
    4. **NO "AI" PUNCTUATION:** Avoid excessive em-dashes (—) or semicolons. Use standard commas and periods. No bullet points.
    5. **OPENER:** Start with a strong "hook" about the company's current challenges or mission (derived from the job description) and how the candidate is the solution. Skip "I hope this finds you well."
    6. **STRUCTURE:** 
       - Paragraph 1: The Hook & The "Why" (Company focus).
       - Paragraph 2: The "How" (Quantified Evidence matching specific Job Req).
       - Paragraph 3: The "Future" (Vision/Culture fit).
       - Paragraph 4: Confident, low-friction close (e.g., "I look forward to discussing how I can [specific value prop]."). 
    7. **FORMATTING:** 
       - No placeholders [ ]. 
       - Start with "Dear Hiring Team,".
       - Sign off simply with "Sincerely," followed by the candidate's name.

    OUTPUT:
    Return ONLY the text of the cover letter. No commentary.
  `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a professional cover letter writer.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('OpenAI failed to generate cover letter');

    return content.trim();
}

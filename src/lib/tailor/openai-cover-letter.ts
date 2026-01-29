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
    You are an elite Career Strategist and Executive Writer. Your goal is to write a cover letter that sounds like it was written by a thoughtful, high-achieving human, NOT an AI.
    
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
    Write a high-impact, professional cover letter.
    
    HUMAN-CENTRIC WRITING RULES (CRITICAL):
    1. AVOID "AI-ISMS": Do NOT use phrases like "I am writing to express my interest," "passionate about," "dynamic professional," or "unique blend of skills." 
    2. NO "AI" PUNCTUATION: Absolutely AVOID em-dashes (—) or multiple hyphens (-) to connect thoughts. Do NOT use bullet points. Use standard, simple business punctuation (commas and periods).
    3. BE DIRECT: Start with a strong, specific opener about why this role and company matter right now. Skip the "I hope this finds you well" fluff.
    4. SHOW, DON'T TELL: Describe a specific achievement from the resume that solves a pain point in the job description.
    5. VOICE: Use a "Sophisticated Professional" voice. It should be authoritative yet humble, clear, and punchy. Short, declarative sentences are preferred.
    6. STRUCTURE: 
       - Paragraph 1: Direct Hook.
       - Paragraph 2: Value/Proof (Major career win).
       - Paragraph 3: Vision/Culture fit.
       - Paragraph 4: Low-friction closing. 
    7. NO PLACEHOLDERS: DO NOT use brackets [ ]. If info is missing, skip it. Start with "Dear Hiring Team,".
    8. SIGN-OFF: Use a professional closing like "Best regards," "Sincerely," or "Thank you for your time and consideration," followed by "${candidateName}".
    
    OUTPUT:
    Return ONLY the text of the cover letter. No commentary. No brackets. No placeholders.
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

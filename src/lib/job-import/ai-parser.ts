import { openai } from '@/lib/ai/openai';
import { JobImportData } from './schemas';

const EXTRACTION_PROMPT = `You are a job posting parser. Extract structured data from the following job posting text.

Return JSON with this exact structure:
{
  "title": "Job title (e.g., Senior Software Engineer)",
  "company": "Company name",
  "location": "City, State or Remote or Hybrid",
  "description": "Full job description text (max 2000 characters)",
  "requirements": ["requirement 1", "requirement 2", ...],
  "salary_range": "Salary range if mentioned (e.g., '$100k-$150k') or null",
  "job_type": "full_time" | "part_time" | "contract" | "internship" | null,
  "remote": true | false | null,
  "confidence": 0-100
}

Rules:
- Only extract information explicitly stated in the text
- If a field is not found, set it to null
- For requirements, extract specific skills, qualifications, and years of experience
- Normalize location format: "City, State" or "Remote" or "City, State (Hybrid)"
- For job_type, use underscores (e.g., "full_time" not "full-time")
- confidence should reflect data quality:
  - 90+: Title, company, description, and requirements all clearly found
  - 70-89: Title and company found, some details missing
  - <70: Minimal information extracted
- For description, include key responsibilities and qualifications
- Keep requirements concise (max 15 items)`;

/**
 * Parse job posting text using GPT-4o-mini and extract structured data
 */
export async function parseJobWithAI(text: string): Promise<JobImportData & { confidence: number }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: text.slice(0, 12000) }, // Limit input to control tokens
    ],
    temperature: 0.3, // Lower temperature for more consistent extraction
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(responseContent);

  // Normalize and validate the response
  return {
    title: parsed.title || '',
    company: parsed.company || '',
    description: parsed.description || null,
    location: parsed.location || null,
    requirements: Array.isArray(parsed.requirements) ? parsed.requirements.slice(0, 15) : null,
    salary_range: parsed.salary_range || null,
    job_type: validateJobType(parsed.job_type),
    remote: typeof parsed.remote === 'boolean' ? parsed.remote : null,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
  };
}

/**
 * Validate job type enum value and convert to database format
 */
function validateJobType(value: unknown): 'full_time' | 'part_time' | 'contract' | 'internship' | null {
  if (typeof value !== 'string') return null;

  const normalized = value.toLowerCase().replace(/-/g, '_');
  const validTypes = ['full_time', 'part_time', 'contract', 'internship'];

  if (validTypes.includes(normalized)) {
    return normalized as 'full_time' | 'part_time' | 'contract' | 'internship';
  }
  return null;
}

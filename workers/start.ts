import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Validate required environment variables
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL || !REDIS_URL.startsWith('redis')) {
  console.error('');
  console.error('ERROR: Invalid REDIS_URL');
  console.error('Current value:', REDIS_URL || '(not set)');
  console.error('');
  console.error('Expected format: redis://localhost:6379 or rediss://...');
  console.error('');
  console.error('To fix, set REDIS_URL in your .env.local:');
  console.error('  REDIS_URL=redis://localhost:6379');
  console.error('');
  console.error('Or use Upstash (free): https://upstash.com');
  console.error('  REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379');
  console.error('');
  process.exit(1);
}

// Initialize Redis connection with TLS support for Upstash
const isUpstash = REDIS_URL.includes('upstash.io');
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Required for Upstash and other cloud Redis providers
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  retryStrategy: (times) => {
    if (times > 5) {
      console.error('Redis connection failed after 5 retries');
      return null;
    }
    return Math.min(times * 500, 3000);
  },
});

connection.on('error', (err) => {
  if (!err.message.includes('ECONNRESET')) {
    console.error('Redis error:', err.message);
  }
});

connection.on('connect', () => {
  console.log('Redis connected successfully' + (isUpstash ? ' (Upstash)' : ''));
});

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface TailorResumeJobData {
  jobId: string;
  userId: string;
  tailoredResumeId: string;
}

interface ResumeExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ParsedResumeData {
  skills?: string[];
  experience?: ResumeExperience[];
  education?: unknown[];
  contact?: unknown;
  summary?: string;
}

interface TailoredExperience extends ResumeExperience {
  tailored_bullets: string[];
}

// Resume Parse Worker
const resumeParseWorker = new Worker(
  'resume-parse',
  async (job) => {
    const { resumeId, userId } = job.data;
    console.log(`Processing resume: ${resumeId} for user: ${userId}`);

    // Worker logic here - can call the same parsing logic
    // This allows background processing for large files

    return { success: true, resumeId };
  },
  {
    connection,
    concurrency: 5,
  }
);

resumeParseWorker.on('completed', (job) => {
  console.log(`Resume parse job ${job.id} completed`);
});

resumeParseWorker.on('failed', (job, err) => {
  console.error(`Resume parse job ${job?.id} failed:`, err);
});

// Tailor Resume Worker
const tailorResumeWorker = new Worker<TailorResumeJobData>(
  'tailor-resume',
  async (job: Job<TailorResumeJobData>) => {
    const { jobId, userId, tailoredResumeId } = job.data;
    console.log(`Tailoring resume for job: ${jobId}, user: ${userId}`);

    try {
      // Update status to processing
      await supabase
        .from('tailored_resumes')
        .update({ status: 'processing' })
        .eq('id', tailoredResumeId);

      // 1. Fetch user's base resume from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('resume_data')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.resume_data) {
        throw new Error('User resume not found. Please upload and parse a resume first.');
      }

      const resumeData = profile.resume_data as ParsedResumeData;

      // 2. Fetch job description
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('title, company, description')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

      if (jobError || !jobData) {
        throw new Error('Job not found');
      }

      if (!jobData.description) {
        throw new Error('Job description is empty. Please add a job description first.');
      }

      // 3. Prompt LLM to rewrite Summary and Experience
      const tailoredContent = await tailorResumeWithLLM(
        resumeData,
        jobData.title,
        jobData.company,
        jobData.description
      );

      // 4. Store the tailored content in tailored_resumes table
      const { error: updateError } = await supabase
        .from('tailored_resumes')
        .update({
          original_resume_data: resumeData,
          tailored_summary: tailoredContent.summary,
          tailored_experience: tailoredContent.experience,
          tailored_skills: tailoredContent.highlighted_skills,
          full_tailored_data: tailoredContent,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tailoredResumeId);

      if (updateError) {
        throw new Error(`Failed to save tailored resume: ${updateError.message}`);
      }

      // Update job status to 'tailored'
      await supabase
        .from('jobs')
        .update({ status: 'tailored', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      console.log(`Successfully tailored resume for job ${jobId}`);
      return { success: true, tailoredResumeId };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to tailor resume: ${errorMessage}`);

      // Update status to failed with error message
      await supabase
        .from('tailored_resumes')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tailoredResumeId);

      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Limit concurrency due to LLM API costs
  }
);

tailorResumeWorker.on('completed', (job) => {
  console.log(`Tailor resume job ${job.id} completed`);
});

tailorResumeWorker.on('failed', (job, err) => {
  console.error(`Tailor resume job ${job?.id} failed:`, err.message);
});

// LLM Tailoring Function
async function tailorResumeWithLLM(
  resumeData: ParsedResumeData,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<{
  summary: string;
  experience: TailoredExperience[];
  highlighted_skills: string[];
  keywords_matched: string[];
}> {
  const systemPrompt = `You are an expert resume writer and career coach. Your task is to tailor a resume to match a specific job description.

You will:
1. Rewrite the professional summary to highlight relevant experience for the target role
2. Rewrite each job experience's bullet points to emphasize skills and achievements that match the job requirements
3. Identify which skills from the resume are most relevant to highlight
4. Extract key keywords from the job description that were matched

Guidelines:
- Keep the same job titles, companies, and dates - only rewrite descriptions and bullets
- Use action verbs and quantifiable achievements where possible
- Mirror language and keywords from the job description naturally
- Keep bullet points concise (1-2 lines each)
- Maintain authenticity - don't invent experience, just reframe existing experience

Return ONLY valid JSON with this structure:
{
  "summary": "Tailored professional summary (2-3 sentences)",
  "experience": [
    {
      "title": "Original Job Title",
      "company": "Original Company",
      "location": "Original Location",
      "startDate": "Original Start Date",
      "endDate": "Original End Date",
      "tailored_bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }
  ],
  "highlighted_skills": ["skill1", "skill2", "skill3"],
  "keywords_matched": ["keyword1", "keyword2"]
}`;

  const userPrompt = `TARGET JOB:
Title: ${jobTitle}
Company: ${company}
Description:
${jobDescription}

---

CURRENT RESUME DATA:

Summary: ${resumeData.summary || 'No summary provided'}

Skills: ${resumeData.skills?.join(', ') || 'No skills listed'}

Experience:
${resumeData.experience?.map((exp, i) => `
${i + 1}. ${exp.title} at ${exp.company}
   ${exp.startDate || ''} - ${exp.endDate || 'Present'}
   ${exp.location || ''}
   ${exp.description || 'No description'}
`).join('\n') || 'No experience listed'}

---

Please tailor this resume for the target job. Return only the JSON response.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from AI');
  }

  const tailoredData = JSON.parse(responseContent);

  // Merge original experience data with tailored bullets
  const mergedExperience: TailoredExperience[] = (resumeData.experience || []).map((exp, index) => ({
    ...exp,
    tailored_bullets: tailoredData.experience?.[index]?.tailored_bullets || [],
  }));

  return {
    summary: tailoredData.summary || '',
    experience: tailoredData.experience || mergedExperience,
    highlighted_skills: tailoredData.highlighted_skills || [],
    keywords_matched: tailoredData.keywords_matched || [],
  };
}

console.log('Workers started and listening for jobs...');
console.log('- resume-parse: Ready');
console.log('- tailor-resume: Ready');

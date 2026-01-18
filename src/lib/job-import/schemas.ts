import { z } from 'zod';

// Schema for AI-extracted job data
export const jobImportSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  requirements: z.array(z.string()).optional().nullable(),
  salary_range: z.string().optional().nullable(),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional().nullable(),
  remote: z.boolean().optional().nullable(),
  confidence: z.number().min(0).max(100).optional(),
});

// Schema for URL import request
export const urlImportRequestSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

// Schema for text import request (fallback)
export const textImportRequestSchema = z.object({
  text: z.string().min(50, 'Please paste at least 50 characters of job description'),
  source_url: z.string().url().optional(),
});

export type JobImportData = z.infer<typeof jobImportSchema>;
export type UrlImportRequest = z.infer<typeof urlImportRequestSchema>;
export type TextImportRequest = z.infer<typeof textImportRequestSchema>;

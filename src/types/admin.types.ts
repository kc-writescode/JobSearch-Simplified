export type TaskStatus = 'Applying' | 'Applied' | 'Trashed';
export type ClientPriority = 'Standard' | 'Premium';
export type AIStatus = 'Pending' | 'In Progress' | 'Completed' | 'Error';

export interface PersonalDetails {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  visa_status?: string;
  years_experience?: number;
  summary?: string;
}

export interface ResumeInfo {
  id: string;
  title?: string;
  job_role?: string;
  file_path?: string;
  status?: string;
  content?: string;
}

export interface VACoreTask {
  id: string;
  jobId: string;
  delegatedJobId?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  deadline: string;
  status: TaskStatus;
  priority: ClientPriority;
  aiStatus: AIStatus;

  // Personal details (Legacy/Current)
  personalDetails?: PersonalDetails;

  // Full Profile Details (Full JSON)
  profileDetails?: any;

  // Selected resume info (the original resume)
  selectedResume?: ResumeInfo;

  // Tailored resume ID (if tailoring completed)
  tailoredResumeId?: string;
  matchAnalytics?: {
    score: number;
    matched_keywords: string[];
    missing_keywords: string[];
  };
  fullTailoredData?: {
    summary: string;
    experience: any[];
    skills?: string[];
  };

  // Cannot apply reason (for trashed tasks)
  cannotApplyReason?: string;

  // Legacy fields
  resume?: {
    id: string;
    content: string;
    tailored?: string;
  };
  coverLetter?: string;
  proofOfWork?: {
    screenshotUrl?: string;
    submissionLink?: string;
    submittedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: ClientPriority[];
  search?: string;
}

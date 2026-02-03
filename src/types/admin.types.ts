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

export interface FeatureAccess {
  cover_letter_enabled: boolean;
  resume_tailor_enabled: boolean;
  custom_resume_enabled: boolean;
}

export interface ResumeSkill {
  category: string;
  items: string[];
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

  // Feature access control (set by master)
  featureAccess?: FeatureAccess;
  credits?: number;

  // Personal details (Legacy/Current)
  personalDetails?: PersonalDetails;

  // Full Profile Details (Full JSON)
  profileDetails?: any;

  // Skills from default resume (parsed_data.skills)
  resumeSkills?: ResumeSkill[];

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
    customResumeUrl?: string;
    submittedAt?: string;
  };
  assignedTo?: string;
  assignedToName?: string;
  assignmentStatus?: 'unassigned' | 'assigned' | 'in_progress' | 'completed';
  assignedAt?: string;
  clientNotes?: string;
  globalNotes?: string;
  certifications?: any[];
  labels?: string[];
  profileUpdatedAt?: string;
  inputLogs?: ClientInputLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientInputLog {
  id: string;
  field_name: string;
  old_value: any;
  new_value: any;
  changed_at: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: ClientPriority[];
  labels?: string[];
  search?: string;
}

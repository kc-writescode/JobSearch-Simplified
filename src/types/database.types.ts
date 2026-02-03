export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Job status enum
export type JobStatus = 'saved' | 'tailoring' | 'tailored' | 'applied' | 'interviewing' | 'offer' | 'closed';

// Resume status enum
export type ResumeStatus = 'uploading' | 'parsing' | 'ready' | 'error';

// Tailored resume status enum
export type TailoredResumeStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Application status enum
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_received'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

// Job type enum
export type JobType = 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';

// Work mode enum
export type WorkMode = 'remote' | 'onsite' | 'hybrid';

// Feature access control type
export type FeatureAccess = {
  cover_letter_enabled: boolean;
  resume_tailor_enabled: boolean;
  custom_resume_enabled: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'enterprise';
          role: 'user' | 'admin' | 'master';
          phone: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          portfolio_url: string | null;
          resume_data: Json | null;
          personal_details: Json;
          is_verified: boolean;
          feature_access: FeatureAccess;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'enterprise';
          role?: 'user' | 'admin' | 'master';
          phone?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          resume_data?: Json | null;
          personal_details?: Json;
          is_verified?: boolean;
          feature_access?: FeatureAccess;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'enterprise';
          role?: 'user' | 'admin' | 'master';
          phone?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          resume_data?: Json | null;
          personal_details?: Json;
          is_verified?: boolean;
          feature_access?: FeatureAccess;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          parsed_text: string | null;
          parsed_data: Json | null;
          status: ResumeStatus;
          error_message: string | null;
          is_primary: boolean;
          title: string | null;
          job_role: string | null;
          parsed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type?: string;
          parsed_text?: string | null;
          parsed_data?: Json | null;
          status?: ResumeStatus;
          error_message?: string | null;
          is_primary?: boolean;
          title?: string | null;
          job_role?: string | null;
          parsed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          parsed_text?: string | null;
          parsed_data?: Json | null;
          status?: ResumeStatus;
          error_message?: string | null;
          is_primary?: boolean;
          title?: string | null;
          job_role?: string | null;
          parsed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          description: string | null;
          requirements: string | null;
          status: JobStatus;
          resume_id: string | null;
          job_type: JobType;
          work_mode: WorkMode;
          location: string | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string;
          job_url: string | null;
          skills: string[] | null;
          is_active: boolean;
          is_favorite: boolean;
          priority: number;
          notes: string | null;
          labels: string[] | null;
          deadline: string | null;
          applied_at: string | null;
          submission_proof: string | null;
          custom_resume_proof: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          description?: string | null;
          requirements?: string | null;
          status?: JobStatus;
          resume_id?: string | null;
          job_type?: JobType;
          work_mode?: WorkMode;
          location?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          job_url?: string | null;
          skills?: string[] | null;
          is_active?: boolean;
          is_favorite?: boolean;
          priority?: number;
          notes?: string | null;
          labels?: string[] | null;
          deadline?: string | null;
          applied_at?: string | null;
          submission_proof?: string | null;
          custom_resume_proof?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string;
          description?: string | null;
          requirements?: string | null;
          status?: JobStatus;
          resume_id?: string | null;
          job_type?: JobType;
          work_mode?: WorkMode;
          location?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          job_url?: string | null;
          skills?: string[] | null;
          is_active?: boolean;
          is_favorite?: boolean;
          priority?: number;
          notes?: string | null;
          labels?: string[] | null;
          deadline?: string | null;
          applied_at?: string | null;
          submission_proof?: string | null;
          custom_resume_proof?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          resume_id: string | null;
          status: ApplicationStatus;
          cover_letter: string | null;
          applied_at: string | null;
          notes: string | null;
          confidence_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          resume_id?: string | null;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          applied_at?: string | null;
          notes?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          resume_id?: string | null;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          applied_at?: string | null;
          notes?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tailored_resumes: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          original_resume_data: Json | null;
          tailored_summary: string | null;
          tailored_experience: Json | null;
          tailored_skills: string[] | null;
          full_tailored_data: Json | null;
          status: TailoredResumeStatus;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          original_resume_data?: Json | null;
          tailored_summary?: string | null;
          tailored_experience?: Json | null;
          tailored_skills?: string[] | null;
          full_tailored_data?: Json | null;
          status?: TailoredResumeStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          original_resume_data?: Json | null;
          tailored_summary?: string | null;
          tailored_experience?: Json | null;
          tailored_skills?: string[] | null;
          full_tailored_data?: Json | null;
          status?: TailoredResumeStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      job_status: JobStatus;
      resume_status: ResumeStatus;
      tailored_resume_status: TailoredResumeStatus;
      application_status: ApplicationStatus;
      job_type: JobType;
      work_mode: WorkMode;
    };
  };
};

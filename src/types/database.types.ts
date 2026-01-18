export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Simplified job status
export type JobStatus = 'saved' | 'tailoring' | 'tailored' | 'applied' | 'interviewing' | 'offer' | 'closed';

// Resume status
export type ResumeStatus = 'uploading' | 'parsing' | 'ready' | 'error';

// Tailored resume status
export type TailoredResumeStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: string;
          phone: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          resume_data: Json | null;
          created_at: string;
          updated_at: string;
          role: 'user' | 'admin';
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
          phone?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          resume_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          role?: 'user' | 'admin';
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
          phone?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          resume_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          role?: 'user' | 'admin';
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
          status: JobStatus;
          job_url: string | null;
          location: string | null;
          notes: string | null;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          description?: string | null;
          status?: JobStatus;
          job_url?: string | null;
          location?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string;
          description?: string | null;
          status?: JobStatus;
          job_url?: string | null;
          location?: string | null;
          notes?: string | null;
          applied_at?: string | null;
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
    };
  };
};

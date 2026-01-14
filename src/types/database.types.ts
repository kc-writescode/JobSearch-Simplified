export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
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
          status: 'uploading' | 'parsing' | 'ready' | 'error';
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
          status?: 'uploading' | 'parsing' | 'ready' | 'error';
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
          status?: 'uploading' | 'parsing' | 'ready' | 'error';
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
          requirements: string | null;
          job_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
          work_mode: 'remote' | 'onsite' | 'hybrid';
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
          deadline: string | null;
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
          job_type?: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
          work_mode?: 'remote' | 'onsite' | 'hybrid';
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
          deadline?: string | null;
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
          job_type?: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
          work_mode?: 'remote' | 'onsite' | 'hybrid';
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
          deadline?: string | null;
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
          status: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
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
          status?: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
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
          status?: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
          cover_letter?: string | null;
          applied_at?: string | null;
          notes?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      application_status: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
      job_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
      work_mode: 'remote' | 'onsite' | 'hybrid';
      resume_status: 'uploading' | 'parsing' | 'ready' | 'error';
    };
  };
};

export interface ResumeExperience {
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string | "Present";
    description: string[]; // List of original bullet points
    technologies?: string[];
}

export interface ResumeEducation {
    institution: string;
    degree: string;
    field: string;
    location: string;
    start_date: string;
    end_date: string;
    gpa?: string;
}

export interface ResumeProject {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
}

export interface ResumeData {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url?: string;
    portfolio_url?: string;
    summary: string;
    skills: {
        category: string;
        items: string[];
    }[];
    experience: ResumeExperience[];
    education: ResumeEducation[];
    projects: ResumeProject[];
    certifications?: string[];
    languages?: string[];
}

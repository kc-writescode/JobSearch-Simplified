import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Free ATS Resume Checker & Job Search Tools | ResumeToJobs',
    description: 'Free ATS resume checker, resume roast tool, career strategy generator, and more. Optimize your resume for Applicant Tracking Systems and boost your interview rate by 300%.',
    keywords: 'ATS resume checker free, ATS score checker, resume optimization tool, applicant tracking system checker, resume scanner free, ATS friendly resume checker, job search tools, career tools',
    openGraph: {
        title: 'Free ATS Resume Checker & Career Tools | ResumeToJobs',
        description: 'Check your ATS resume score for free. Our tools help you optimize your resume, beat applicant tracking systems, and land more interviews.',
        type: 'website',
        url: 'https://resumetojobs.com/tools',
        siteName: 'ResumeToJobs',
        images: [
            {
                url: 'https://resumetojobs.com/og-tools.jpg',
                width: 1200,
                height: 630,
                alt: 'Free ATS Resume Checker - ResumeToJobs Tools'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Free ATS Resume Checker & Job Search Tools',
        description: 'Optimize your resume for ATS, get your resume roasted, and access free career tools. Boost your interview rate by 300%.',
        images: ['https://resumetojobs.com/og-tools.jpg']
    },
    alternates: {
        canonical: 'https://resumetojobs.com/tools'
    }
};

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

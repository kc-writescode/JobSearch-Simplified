import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Job Application Services & Career Advice | ResumeToJobs Blog 2026',
    description: 'Expert guides on hiring job application services, ATS resume optimization, automated job applications, and time-saving career strategies. Learn how to apply to 100+ jobs monthly without burnout.',
    keywords: 'hire someone to apply for jobs, automated job application service, ATS resume checker, job application help, resume customization service, no time to apply for jobs, job search automation, professional job applicator',
    openGraph: {
        title: 'Should You Hire Someone to Apply for Jobs? Expert Career Guides',
        description: 'Discover how job application services save 40+ hours monthly while 3x your interview rate. Complete guides on ATS optimization, automation, and beating job search fatigue.',
        type: 'website',
        url: 'https://resumetojobs.com/blog',
        siteName: 'ResumeToJobs',
        images: [
            {
                url: 'https://resumetojobs.com/og-blog.jpg',
                width: 1200,
                height: 630,
                alt: 'ResumeToJobs Blog - Job Application Services & Career Guides'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Job Application Services & Career Strategies | ResumeToJobs',
        description: 'Expert guides on automated job applications, ATS optimization, and time-saving career strategies for busy professionals.',
        images: ['https://resumetojobs.com/og-blog.jpg']
    },
    alternates: {
        canonical: 'https://resumetojobs.com/blog'
    }
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

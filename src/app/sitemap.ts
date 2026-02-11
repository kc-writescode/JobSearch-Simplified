import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://resumetojobs.com';

    // Blog post slugs
    const blogPosts = [
        'hire-someone-apply-jobs-for-me',
        'no-time-apply-jobs-solutions',
        'automated-job-application-services-worth-it',
        'job-application-fatigue-solutions',
        'ats-resume-optimization-guide',
        'apply-to-100-jobs-per-month',
        'remote-work-2026-guide',
        'highest-paying-jobs-us-2026'
    ];

    const blogPostUrls = blogPosts.map(slug => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9
        },
        {
            url: `${baseUrl}/tools`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5
        },
        ...blogPostUrls
    ];
}

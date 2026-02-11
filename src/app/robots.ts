import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/(admin-master)/', '/(dashboard)/']
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/(admin-master)/', '/(dashboard)/'],
                crawlDelay: 0
            }
        ],
        sitemap: 'https://resumetojobs.com/sitemap.xml'
    };
}

import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import '@/lib/utils/suppress-extension-warnings';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://resumetojobs.com'),
  title: {
    default: 'ResumeToJobs | Hire Someone to Apply for Jobs for You | 500 Apps/Month',
    template: '%s | ResumeToJobs',
  },
  description: 'Hire someone to apply for jobs for you. ResumeToJobs handles resume customization, cover letters & job applications. Save 40+ hours/month, get 3x more interviews. Free ATS checker, 0% commission. Starting at $249/month.',
  keywords: [
    'hire someone to apply for jobs for me',
    'automated job application service',
    'ATS resume checker free',
    'resume customization service',
    'job application help',
    'professional job applicator',
    'no time to apply for jobs',
    'job search automation',
    'AI resume tailoring',
    'job application service',
    'mass job application',
    'apply to 100 jobs',
    'job search fatigue',
    'career services',
    'resume optimization',
    'cover letter generator',
    'ATS optimization',
  ],
  authors: [{ name: 'ResumeToJobs' }],
  creator: 'ResumeToJobs',
  publisher: 'ResumeToJobs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://resumetojobs.com',
    siteName: 'ResumeToJobs',
    title: 'ResumeToJobs | Your Automated Job Search Partner',
    description: 'AI-powered job application service with 24-hour turnaround. We handle resume tailoring, cover letters, and applications while you focus on landing the offer.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResumeToJobs - AI-Powered Job Application Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeToJobs | AI-Powered Job Application Service',
    description: 'Stop the manual job search grind. Our AI + human team handles applications in 24 hours with real-time tracking and zero commission.',
    images: ['/og-image.png'],
    creator: '@resumetojobs',
  },
  alternates: {
    canonical: 'https://resumetojobs.com',
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.png', sizes: 'any' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  category: 'Career Services',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'ResumeToJobs',
    description: 'Professional job application service. We handle resume tailoring, cover letters, and job applications so busy professionals can save 40+ hours per month.',
    url: 'https://resumetojobs.com',
    logo: 'https://resumetojobs.com/logo.png',
    priceRange: '$249-$599',
    serviceType: 'Job Application Service',
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Job Application Plans',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Kickstart Plan',
          price: '249',
          priceCurrency: 'USD',
          description: '500 custom-tailored job applications in 1 month with free cover letters, real-time dashboard, and 0% salary commission.',
        },
        {
          '@type': 'Offer',
          name: 'Accelerate Plan',
          price: '549',
          priceCurrency: 'USD',
          description: '1,500 custom-tailored job applications in 3 months with free cover letters, real-time dashboard, and 0% salary commission.',
        },
        {
          '@type': 'Offer',
          name: 'Scale Plan',
          price: '599',
          priceCurrency: 'USD',
          description: '3,000 custom-tailored job applications in 6 months with free cover letters, real-time dashboard, and 0% salary commission.',
        },
      ],
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I hire someone to apply for jobs for me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! ResumeToJobs is a professional service that applies for jobs on your behalf. We customize your resume for each position, write cover letters, and submit applications. You save 40+ hours per month while getting 3x more interviews.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does an automated job application service work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ResumeToJobs assigns a dedicated team to your job search. We scout matching positions, tailor your resume with ATS-optimized keywords, write cover letters, submit applications, and provide proof of every submission through a real-time dashboard.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free ATS resume checker?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, ResumeToJobs offers a free ATS resume checker tool that analyzes your resume against job descriptions and provides an ATS compatibility score with keyword suggestions.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does a job application service cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ResumeToJobs plans start at $249/month for 500 applications. The Accelerate plan is $549 for 1,500 applications over 3 months, and the Scale plan is $599 for 3,000 applications over 6 months. All plans include custom resume tailoring, free cover letters, and 0% salary commission.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many interviews will I get?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our clients typically see an 18-25% interview rate compared to the 2-5% DIY average. With 500 applications, clients average 90-125 interviews. Most clients receive their first interview within 7-14 days of starting service.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you charge a percentage of my salary?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, ResumeToJobs charges 0% salary commission. We have transparent flat-rate pricing with no hidden fees. Your salary is 100% yours.',
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

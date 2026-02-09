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
    default: 'ResumeToJobs | AI-Powered Job Application Service',
    template: '%s | ResumeToJobs',
  },
  description: 'Stop spending 4+ hours daily on job applications. Our AI-powered service handles resume tailoring, cover letters, and applications while you focus on interview prep. 24-hour turnaround, real-time tracking, zero commission.',
  keywords: [
    'job search automation',
    'AI resume tailoring',
    'job application service',
    'automated job applications',
    'career services',
    'resume optimization',
    'cover letter generator',
    'job hunt assistance',
    'employment services',
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
    description: 'AI-powered job application service with human oversight. We handle resume tailoring, cover letters, and job applications.',
    url: 'https://resumetojobs.com',
    logo: 'https://resumetojobs.com/logo.png',
    priceRange: '$199/month',
    serviceType: 'Job Application Service',
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    offers: {
      '@type': 'Offer',
      name: 'Full Operations Plan',
      price: '199',
      priceCurrency: 'USD',
      description: 'Fully managed job application service with AI-tailored resumes, cover letters, and 24-hour turnaround.',
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

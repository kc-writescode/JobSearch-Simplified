import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import '@/lib/utils/suppress-extension-warnings';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobSearch Simplified - Automated Job Application Intelligence',
  description: 'Streamline your job search with AI-powered automation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

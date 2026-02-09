import React from 'react';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
    const scrollToTop = (e: React.MouseEvent) => {
        if (window.location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <Link
            href="/"
            className={`flex items-center gap-4 group transition-all duration-300 transform hover:scale-105 ${className}`}
            onClick={scrollToTop}
            aria-label="ResumeToJobs Home"
        >
            <div className="relative h-14 transition-all duration-300">
                <img
                    src="/logo.png"
                    alt="ResumeToJobs Logo"
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                        // Fallback in case logo.png is not found yet
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-blue-600', 'flex', 'items-center', 'justify-center');
                        target.parentElement!.innerHTML = '<span class="text-white font-black text-sm">RTJ</span>';
                    }}
                />
            </div>
            {showText && (
                <span className="text-2xl font-bold text-neutral-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    ResumeTo<span className="text-blue-600">Jobs</span>
                </span>
            )}
        </Link>
    );
}

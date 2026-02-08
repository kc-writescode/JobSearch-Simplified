import React from 'react';

// Common defs for gradients/shadows to be reused or specifically defined per icon
const CommonDefs = () => (
    <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
        </filter>
        <linearGradient id="paper-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
    </defs>
);

export const ATSIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        {/* Document Background */}
        <rect x="10" y="4" width="28" height="36" rx="3" fill="url(#paper-grad)" stroke="#E2E8F0" strokeWidth="1" filter="url(#shadow)" />
        {/* Lines */}
        <path d="M16 12H32" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 18H32" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 24H24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        {/* Success Badge */}
        <circle cx="34" cy="34" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M29 34L32.5 37.5L39 30.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const NetflixIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="22" fill="black" />
        <path d="M16 12V36" stroke="#E50914" strokeWidth="8" />
        <path d="M32 12V36" stroke="#E50914" strokeWidth="8" />
        <path d="M16 12L32 36" stroke="#E50914" strokeWidth="8" />
        {/* Shadow for the diagonal to give depth */}
        <path d="M16 12L32 36" stroke="black" strokeWidth="8" strokeOpacity="0.2" />
    </svg>
);

export const WikiIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect width="48" height="48" fill="white" fillOpacity="0" />
        <path d="M12.5 12L17 38L22 20L24 28L26 20L31 38L35.5 12H31L28.5 30L25 15H23L19.5 30L17 12H12.5Z" fill="black" stroke="black" strokeWidth="1" />
    </svg>
);

export const RoastIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        {/* Outer Layer - Red/Orange */}
        <path d="M24 2C24 2 10 16 10 28C10 36.8366 16.268 44 24 44C31.732 44 38 36.8366 38 28C38 16 24 2 24 2Z" fill="#EA580C" />
        {/* Middle Layer - Orange */}
        <path d="M24 10C24 10 14 20 14 29C14 35.0751 18.4772 40 24 40C29.5228 40 34 35.0751 34 29C34 20 24 10 24 10Z" fill="#F97316" />
        {/* Inner Layer - Yellow */}
        <path d="M24 22C24 22 18 28 18 33C18 36.3137 20.6863 39 24 39C27.3137 39 30 36.3137 30 33C30 28 24 22 24 22Z" fill="#FACC15" />
    </svg>
);

export const StrategyIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        {/* Target Board */}
        <circle cx="24" cy="24" r="18" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" filter="url(#shadow)" />
        <circle cx="24" cy="24" r="12" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2" />
        <circle cx="24" cy="24" r="6" fill="#EF4444" stroke="#EF4444" strokeWidth="1" />
        {/* Dart */}
        <path d="M38 10L28 20" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 20L25 23" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 10L42 6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 10L36 6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 10L42 12" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const PredictorIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        <defs>
            <radialGradient id="ball-grad" cx="0.5" cy="0.5" r="0.5" fx="0.3" fy="0.3">
                <stop offset="0%" stopColor="#F0F9FF" />
                <stop offset="100%" stopColor="#BAE6FD" />
            </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="18" fill="url(#ball-grad)" stroke="#0EA5E9" strokeWidth="2" filter="url(#shadow)" />
        {/* Sparkles/Stars */}
        <path d="M16 16L18 12L20 16L24 18L20 20L18 24L16 20L12 18L16 16Z" fill="#0EA5E9" />
        <circle cx="32" cy="30" r="2" fill="#0EA5E9" />
        <circle cx="15" cy="32" r="1.5" fill="#0EA5E9" />
        {/* Base */}
        <path d="M16 40H32" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const BuzzwordIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        {/* Document */}
        <rect x="10" y="6" width="28" height="36" rx="2" fill="url(#paper-grad)" stroke="#E2E8F0" strokeWidth="1" filter="url(#shadow)" />
        <path d="M16 14H32" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 34H24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        {/* Red Strike */}
        <rect x="14" y="20" width="20" height="4" rx="1" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1" />
        <path d="M10 44L38 4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.1" />
        {/* Warning Icon overlay */}
        <path d="M36 36L32 28H40L36 36Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
    </svg>
);

export const IntroIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        {/* Mic Body */}
        <rect x="18" y="10" width="12" height="18" rx="6" fill="#F8FAFC" stroke="#334155" strokeWidth="2" filter="url(#shadow)" />
        <path d="M21 10V28" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M27 10V28" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        {/* Mic Stand */}
        <path d="M12 24V26C12 32.6274 17.3726 38 24 38C30.6274 38 36 32.6274 36 26V24" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 38V44" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 44H30" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        {/* Accent */}
        <circle cx="24" cy="19" r="2" fill="#EF4444" />
    </svg>
);

export const AppleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        <CommonDefs />
        {/* Monitor */}
        <rect x="4" y="8" width="40" height="28" rx="3" fill="#F8FAFC" stroke="#475569" strokeWidth="2" filter="url(#shadow)" />
        {/* Stand */}
        <path d="M24 36V42" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 42H28" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        {/* Screen Content */}
        <rect x="8" y="12" width="32" height="20" fill="#E2E8F0" opacity="0.5" />
        <circle cx="24" cy="22" r="5" fill="#1E293B" />
        <path d="M16 36H32" stroke="#CBD5E1" strokeWidth="1" />
    </svg>
);

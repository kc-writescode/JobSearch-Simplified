'use client';

import React from 'react';
import { ToolsHero } from '@/components/tools/ToolsHero';
import { ToolCard } from '@/components/tools/ToolCard';
import { ArrowRight, Rocket, CheckCircle2, Star, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
    ATSIcon,
    NetflixIcon,
    WikiIcon,
    RoastIcon,
    StrategyIcon,
    PredictorIcon,
    BuzzwordIcon,
    IntroIcon,
    AppleIcon
} from '@/components/tools/ToolIcons';

const TOOLS = [
    {
        id: 'ats-checker',
        title: 'ATS Score Checker',
        description: 'See how well your resume passes hiring software filters and get actionable tips.',
        icon: <ATSIcon />,
        color: 'emerald' as const,
    },
    {
        id: 'netflix-career',
        title: 'Career Netflix Series',
        description: 'Turn your career journey into a fun Netflix show style page to share.',
        icon: <NetflixIcon />,
        color: 'rose' as const,
    },
    {
        id: 'wikipedia-page',
        title: 'Wikipedia Page Maker',
        description: 'Create a professional Wikipedia-style bio about your career achievements.',
        icon: <WikiIcon />,
        color: 'blue' as const,
    },
    {
        id: 'resume-roast',
        title: 'Roast My Resume',
        description: 'Get honest (and funny) feedback on how to improve your resume.',
        icon: <RoastIcon />,
        color: 'amber' as const,
    },
    {
        id: 'job-search-strategy',
        title: '30-Day Job Plan',
        description: 'Get a personalized daily action plan to help you land a job fast.',
        icon: <StrategyIcon />,
        isNew: true,
        color: 'purple' as const,
    },
    {
        id: 'interview-predictor',
        title: 'Interview Predictor',
        description: 'Predict likely interview questions based on your resume and industry.',
        icon: <PredictorIcon />,
        color: 'indigo' as const,
    },
    {
        id: 'buzzword-detector',
        title: 'Buzzword Detector',
        description: 'Find and remove overused words that recruiters are tired of seeing.',
        icon: <BuzzwordIcon />,
        color: 'rose' as const,
    },
    {
        id: 'killer-self-intro',
        title: 'Self-Intro Generator',
        description: 'Create a powerful 30-second intro to impress any interviewer.',
        icon: <IntroIcon />,
        color: 'slate' as const,
    },
    {
        id: 'apple-keynote',
        title: 'Apple Keynote Maker',
        description: 'Generate an Apple-style presentation about your career highlights.',
        icon: <AppleIcon />,
        color: 'slate' as const,
    },
];

export default function FreeToolsPage() {
    const router = useRouter();

    const handleToolClick = (toolId: string) => {
        router.push(`/tools/${toolId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <ToolsHero />

            {/* Tools Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-16">
                {/* Section header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Tools</h2>
                        <p className="text-slate-500 text-sm mt-1">Choose a tool to get started</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="font-semibold text-emerald-700">{TOOLS.length} tools available</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TOOLS.map((tool) => (
                        <ToolCard
                            key={tool.id}
                            {...tool}
                            onClick={() => handleToolClick(tool.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Premium CTA Section */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 py-20 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="text-center space-y-6">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full">
                            <Rocket className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold text-white/90">Ready to accelerate your job search?</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Stop applying manually.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Let AI do the heavy lifting.</span>
                        </h2>

                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Our premium service automatically tailors your resume for each job, writes custom cover letters, and helps you apply to hundreds of jobs while you focus on what matters.
                        </p>

                        {/* Feature list */}
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            {[
                                'AI-Tailored Resumes',
                                'Custom Cover Letters',
                                'ATS-Optimized',
                                'Unlimited Applications'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-semibold text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Social proof */}
                        <div className="flex items-center justify-center gap-6 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-900 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-slate-400">1,000+ job seekers</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                                <span className="text-sm text-slate-400 ml-1">4.9/5 rating</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                            <button
                                onClick={() => router.push('/#pricing')}
                                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all"
                            >
                                View Premium Plans
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a
                                href="https://cal.id/krishna-chaitanya/connect-with-founder"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-4 text-white/80 hover:text-white font-semibold text-sm transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Book a Free Demo Call
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

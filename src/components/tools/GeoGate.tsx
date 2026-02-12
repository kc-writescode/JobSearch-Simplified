'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Clock, Bell } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface GeoGateProps {
    children: React.ReactNode;
}

export function GeoGate({ children }: GeoGateProps) {
    const [isUS, setIsUS] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkGeo = async () => {
            try {
                const res = await fetch('/api/geo');
                if (res.ok) {
                    const data = await res.json();
                    setIsUS(data.isUS);
                } else {
                    // Fail-open: allow access if API fails
                    setIsUS(true);
                }
            } catch {
                // Fail-open
                setIsUS(true);
            } finally {
                setLoading(false);
            }
        };
        checkGeo();
    }, []);

    // Loading state — minimal skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Checking availability...</p>
                </div>
            </div>
        );
    }

    // US users — show the tools normally
    if (isUS) {
        return <>{children}</>;
    }

    // Non-US users — show the "Coming Soon" message
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo />
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            <main className="pt-36 pb-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Animated icon */}
                    <div className="relative inline-block mb-12">
                        <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center relative border border-white/10 backdrop-blur-sm">
                            <Sparkles className="w-12 h-12 text-blue-400" />
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 animate-pulse"></div>
                        </div>
                        {/* Floating dots */}
                        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-blue-500/30 blur-sm animate-pulse"></div>
                        <div className="absolute -bottom-2 -left-4 w-8 h-8 rounded-full bg-indigo-500/20 blur-md animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/5 text-blue-300 text-xs font-bold uppercase tracking-[0.2em] rounded-full mb-8 border border-white/10 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        Launching Soon
                    </div>

                    {/* Main heading */}
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        <span className="text-white">Something Great</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Is on the Way
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto mb-12">
                        We&apos;re putting the finishing touches on our free career tools for your region. Get notified the moment they go live — don&apos;t miss out.
                    </p>

                    {/* Tools preview cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-12">
                        {[
                            { name: 'ATS Score Checker', icon: '📊' },
                            { name: 'Resume Roast', icon: '🔥' },
                            { name: 'Interview Predictor', icon: '🎯' },
                            { name: '30-Day Job Plan', icon: '📋' },
                            { name: 'Buzzword Detector', icon: '🔍' },
                            { name: 'Self-Intro Generator', icon: '🎤' },
                        ].map((tool, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] backdrop-blur-sm group hover:bg-white/[0.06] transition-all"
                            >
                                <span className="text-lg opacity-50 group-hover:opacity-80 transition-opacity">{tool.icon}</span>
                                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{tool.name}</span>
                                <Clock className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I%27d+like+to+be+notified+when+the+free+career+tools+are+available+in+my+region&type=phone_number&app_absent=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all border border-blue-400/20"
                        >
                            <Bell className="w-5 h-5" />
                            Get Notified at Launch
                        </a>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-slate-400 hover:text-white font-semibold text-sm rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            Explore Our Services
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Bottom note */}
                    <p className="mt-14 text-xs text-slate-600">
                        Need immediate assistance?{' '}
                        <a
                            href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I+need+help+with+ResumeToJobs+tools&type=phone_number&app_absent=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 underline underline-offset-2 transition-colors"
                        >
                            Reach out to our team
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}

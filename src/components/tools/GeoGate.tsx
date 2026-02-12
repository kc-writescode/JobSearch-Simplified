'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Bell } from 'lucide-react';
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
                        <Clock className="w-6 h-6 text-neutral-300" />
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
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <Link
                        href="/"
                        className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                        ← Home
                    </Link>
                </div>
            </nav>

            <main className="pt-40 pb-32 px-6">
                <div className="max-w-md mx-auto text-center">
                    {/* Simple icon */}
                    <div className="w-14 h-14 mx-auto mb-8 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-neutral-400" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-3">
                        Coming soon to your region
                    </h1>

                    {/* Description */}
                    <p className="text-sm text-neutral-400 leading-relaxed mb-10">
                        Our free career tools aren&apos;t available in your area yet. We&apos;ll let you know when they launch.
                    </p>

                    {/* Tools list */}
                    <div className="space-y-2 mb-10">
                        {[
                            'ATS Score Checker',
                            'Resume Roast',
                            'Interview Predictor',
                            '30-Day Job Plan',
                            'Buzzword Detector',
                            'Self-Intro Generator',
                        ].map((tool, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-100"
                            >
                                <span className="text-sm text-neutral-500">{tool}</span>
                                <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider">Soon</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <a
                        href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I%27d+like+to+be+notified+when+the+free+career+tools+are+available+in+my+region&type=phone_number&app_absent=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                        <Bell className="w-4 h-4" />
                        Notify me when available
                    </a>

                    <Link
                        href="/"
                        className="block mt-3 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        Explore our services →
                    </Link>
                </div>
            </main>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, MapPin, ArrowRight, Sparkles, Clock, Bell } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface GeoGateProps {
    children: React.ReactNode;
}

export function GeoGate({ children }: GeoGateProps) {
    const [isUS, setIsUS] = useState<boolean | null>(null);
    const [country, setCountry] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkGeo = async () => {
            try {
                const res = await fetch('/api/geo');
                if (res.ok) {
                    const data = await res.json();
                    setIsUS(data.isUS);
                    setCountry(data.country || '');
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
                        <Globe className="w-6 h-6 text-blue-400" />
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo />
                    <Link
                        href="/"
                        className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Hero illustration */}
                    <div className="relative inline-block mb-10">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative">
                            <Globe className="w-16 h-16 text-blue-500" />
                            {/* Animated ping on the globe */}
                            <div className="absolute top-2 right-2">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center">
                                        <MapPin className="w-2.5 h-2.5 text-white" />
                                    </span>
                                </span>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-50 rounded-full blur-xl opacity-60"></div>
                        <div className="absolute -bottom-2 -right-6 w-12 h-12 bg-indigo-50 rounded-full blur-xl opacity-60"></div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Coming Soon
                    </div>

                    {/* Main heading */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-6 leading-tight">
                        Coming to Your
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Country Soon
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto mb-10">
                        Our free career tools are currently available exclusively for job seekers in the <strong className="text-neutral-700">United States</strong>. We&apos;re working hard to expand globally and bring these tools to your region.
                    </p>

                    {/* Current availability info */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-sm mb-10 max-w-lg mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-green-700">Available in US</span>
                            </div>
                            {country && country !== 'UNKNOWN' && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full border border-neutral-200">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                    <span className="text-sm font-medium text-neutral-500">Your location: {country}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {[
                                'Free ATS Score Checker',
                                'Resume Roast & Feedback',
                                '30-Day Job Search Strategy',
                                'Interview Question Predictor',
                                'And 5 more career tools...',
                            ].map((tool, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-neutral-500">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < 4 ? 'bg-blue-50' : 'bg-neutral-50'}`}>
                                        {i < 4 ? (
                                            <Sparkles className="w-3 h-3 text-blue-500" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-neutral-400">+</span>
                                        )}
                                    </div>
                                    <span>{tool}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I%27m+interested+in+ResumeToJobs+tools+for+my+country&type=phone_number&app_absent=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
                        >
                            <Bell className="w-5 h-5" />
                            Notify Me When Available
                        </a>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-neutral-700 font-semibold text-sm rounded-xl border-2 border-neutral-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                        >
                            Explore Our Services
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Bottom note */}
                    <p className="mt-10 text-xs text-neutral-400">
                        Have a US-based job search? Try accessing from a US network or{' '}
                        <a
                            href="https://api.whatsapp.com/send/?phone=919493063818&text=Hi+I+need+access+to+the+free+tools+for+US+job+search&type=phone_number&app_absent=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 underline transition-colors"
                        >
                            contact us
                        </a>{' '}
                        for assistance.
                    </p>
                </div>
            </main>
        </div>
    );
}

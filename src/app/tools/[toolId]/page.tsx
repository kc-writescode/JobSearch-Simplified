'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
    ArrowLeft,
    ArrowRight,
    Upload,
    ShieldCheck,
    ShieldAlert,
    Sparkles,
    Download,
    Share2,
    RefreshCcw,
    Gauge,
    Tv,
    Globe,
    Flame,
    Target,
    Zap,
    Cpu,
    ExternalLink,
    Mail,
    User,
    FileText,
    CheckCircle2,
    Rocket,
    Star,
    Lock,
    Copy
} from 'lucide-react';
import { toast } from 'sonner';

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

const TOOLS_CONFIG: any = {
    'ats-checker': {
        title: 'ATS Score Checker',
        description: 'See how well your resume matches what hiring software is looking for.',
        icon: <ATSIcon />,
        color: 'emerald',
        gradient: 'from-emerald-400 to-teal-600',
        bgGradient: 'from-emerald-50 to-teal-50'
    },
    'netflix-career': {
        title: 'Career Netflix Series',
        description: 'Transform your professional journey into a fun Netflix-style show page.',
        icon: <NetflixIcon />,
        color: 'rose',
        gradient: 'from-rose-500 to-orange-600',
        bgGradient: 'from-rose-50 to-orange-50'
    },
    'wikipedia-page': {
        title: 'Wikipedia Page Maker',
        description: 'Create a professional Wikipedia-style biography about your career.',
        icon: <WikiIcon />,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50'
    },
    'resume-roast': {
        title: 'Roast My Resume',
        description: 'Get honest and funny feedback on how to improve your resume.',
        icon: <RoastIcon />,
        color: 'orange',
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 to-red-50'
    },
    'job-search-strategy': {
        title: '30-Day Job Plan',
        description: 'Get a personalized daily strategy to help you land your next job fast.',
        icon: <StrategyIcon />,
        color: 'indigo',
        gradient: 'from-indigo-500 to-purple-600',
        bgGradient: 'from-indigo-50 to-purple-50'
    },
    'interview-predictor': {
        title: 'Interview Predictor',
        description: 'Predict likely interview questions based on your resume and industry.',
        icon: <PredictorIcon />,
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-600',
        bgGradient: 'from-blue-50 to-cyan-50'
    },
    'buzzword-detector': {
        title: 'Buzzword Detector',
        description: 'Find and remove overused words that recruiters are tired of seeing.',
        icon: <BuzzwordIcon />,
        color: 'rose',
        gradient: 'from-rose-500 to-pink-600',
        bgGradient: 'from-rose-50 to-pink-50'
    },
    'killer-self-intro': {
        title: 'Self-Intro Generator',
        description: 'Create a powerful 30-second intro to impress any interviewer.',
        icon: <IntroIcon />,
        color: 'slate',
        gradient: 'from-slate-600 to-slate-800',
        bgGradient: 'from-slate-50 to-gray-50'
    },
    'apple-keynote': {
        title: 'Apple Keynote Maker',
        description: 'Generate an Apple-style presentation about your career highlights.',
        icon: <AppleIcon />,
        color: 'slate',
        gradient: 'from-slate-700 to-slate-900',
        bgGradient: 'from-slate-50 to-gray-50'
    }
};

export default function ToolPage() {
    const params = useParams();
    const router = useRouter();
    const toolId = params.toolId as string;
    const config = TOOLS_CONFIG[toolId] || {
        title: 'Career Power-up',
        description: 'Unlock your professional potential with AI-driven insights.',
        icon: <Cpu className="h-10 w-10" />,
        color: 'slate',
        gradient: 'from-slate-500 to-slate-800'
    };

    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [resultData, setResultData] = useState<any>(null);
    const [extractedStats, setExtractedStats] = useState<any>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !email) {
            toast.error('Please provide a resume and email');
            return;
        }

        setStep('processing');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', email);
        formData.append('name', name);
        formData.append('toolId', toolId);

        try {
            const res = await fetch('/api/tools/process', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Processing failed');

            const data = await res.json();
            setResultData(data.tool_data);
            setExtractedStats(data.extracted);
            setStep('result');
            toast.success('Analysis complete!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to process. Please try again.');
            setStep('upload');
        }
    };

    const handleDownload = async () => {
        if (!reportRef.current) return;

        const toastId = toast.loading('Generating PDF report...');

        try {
            // Clone the element to avoid modifying the original
            const element = reportRef.current;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null, // Preserve original backgrounds
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure backgrounds are preserved in the cloned document
                    const clonedElement = clonedDoc.body.querySelector('[data-report-container]');
                    if (clonedElement) {
                        (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Add some padding
            const margin = 5;
            const contentWidth = pdfWidth - (margin * 2);
            const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

            let heightLeft = contentHeight;
            let position = margin;

            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
            heightLeft -= (pdfHeight - margin * 2);

            while (heightLeft > 0) {
                position = heightLeft - contentHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
                heightLeft -= (pdfHeight - margin * 2);
            }

            pdf.save(`${toolId}-report.pdf`);
            toast.dismiss(toastId);
            toast.success('PDF downloaded!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.dismiss(toastId);
            toast.error('Failed to generate PDF. Reverting to text...');

            // Fallback to text download
            const text = JSON.stringify(resultData, null, 2);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${toolId}-report.txt`;
            a.click();
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: config.title,
                    text: `Check out my ${config.title} results on ResumeToJobs!`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Unified Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group" aria-label="ResumeToJobs Home">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:shadow-blue-300/50 transition-shadow">
                            <span className="text-white font-extrabold text-sm">RTJ</span>
                        </div>
                        <span className="text-xl font-bold text-neutral-900 tracking-tight">
                            ResumeTo<span className="text-blue-600">Jobs</span>
                        </span>
                    </a>
                    <div className="hidden md:flex gap-4 items-center">
                        <button
                            onClick={() => router.push('/tools')}
                            className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Tools
                        </button>
                    </div>
                </div>
            </nav>

            <div className="pt-24">
            </div>

            <main className="max-w-7xl mx-auto px-8 py-16">
                {step === 'upload' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Hero section for the tool */}
                        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${config.bgGradient || 'from-slate-50 to-gray-50'} border border-slate-100 p-8 md:p-12 mb-10`}>
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/40 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-2xl" />
                            </div>
                            <div className="relative z-10 text-center space-y-5">
                                <div className="inline-flex items-center justify-center">
                                    <div className={`h-16 w-16 flex items-center justify-center p-3 rounded-2xl bg-white shadow-lg border border-slate-100`}>
                                        {React.cloneElement(config.icon as React.ReactElement, { className: 'h-10 w-10' })}
                                    </div>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                    {config.title}
                                </h2>
                                <p className="text-base text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                                    {config.description} Upload your resume below to get started.
                                </p>
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-full border border-blue-100 shadow-sm">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI-Powered
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 shadow-sm">
                                        <Lock className="h-3.5 w-3.5" />
                                        100% Private
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-600 text-xs font-bold rounded-full border border-amber-100 shadow-sm">
                                        <Zap className="h-3.5 w-3.5" />
                                        Instant Results
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="max-w-2xl mx-auto space-y-6">
                            {/* Input fields with better styling */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    Your Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">Email Address <span className="text-rose-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">We'll send you a copy of your report to this email.</p>
                            </div>

                            {/* Upload area with better design */}
                            <div
                                className={`relative rounded-2xl p-8 text-center transition-all border-2 border-dashed ${file ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-400 bg-white'}`}
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile?.type === 'application/pdf') setFile(droppedFile);
                                }}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    id="resume-upload"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="resume-upload" className="cursor-pointer block space-y-4">
                                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}>
                                        {file ? <CheckCircle2 className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-bold text-slate-900">
                                            {file ? file.name : 'Drop your resume here or click to browse'}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {file ? 'Click to change file' : 'PDF format only • Max 10MB'}
                                        </p>
                                    </div>
                                    {file && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                            <FileText className="h-3.5 w-3.5" />
                                            Resume uploaded successfully
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                className={`w-full py-5 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    file && email
                                        ? `bg-gradient-to-r ${config.gradient} text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                                        : 'bg-slate-200 text-slate-400'
                                }`}
                                disabled={!file || !email}
                            >
                                <Sparkles className="h-5 w-5" />
                                Generate My Report
                                <ArrowRight className="h-5 w-5" />
                            </button>

                            <p className="text-center text-xs text-slate-400">
                                Your data is processed securely and never shared with third parties.
                            </p>
                        </form>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-10 animate-in fade-in duration-500">
                        {/* Animated loader */}
                        <div className="relative">
                            <div className={`h-32 w-32 rounded-full bg-gradient-to-br ${config.bgGradient || 'from-blue-50 to-indigo-50'} flex items-center justify-center`}>
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                                <div className={`absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent bg-gradient-to-r ${config.gradient} animate-spin`} style={{ borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' }} />
                                <div className="relative z-10 h-20 w-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                                    {React.cloneElement(config.icon as React.ReactElement, { className: 'h-10 w-10 animate-pulse' })}
                                </div>
                            </div>
                        </div>

                        {/* Status text */}
                        <div className="text-center space-y-4 max-w-md">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analyzing Your Resume</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    Our AI is extracting insights from your resume. This usually takes 10-20 seconds.
                                </p>
                            </div>
                        </div>

                        {/* Progress steps */}
                        <div className="flex items-center gap-3">
                            {['Parsing', 'Analyzing', 'Generating'].map((step, i) => (
                                <div key={step} className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-500 text-white' : i === 1 ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                                        {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <span className={`text-xs font-semibold ${i <= 1 ? 'text-slate-700' : 'text-slate-400'}`}>{step}</span>
                                    {i < 2 && <ArrowRight className="w-4 h-4 text-slate-300" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'result' && resultData && (
                    <div ref={reportRef} data-report-container className="space-y-8 animate-in fade-in duration-500 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100" style={{ backgroundColor: '#ffffff' }}>
                        {/* Compact Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
                                    {React.cloneElement(config.icon as React.ReactElement, { className: 'h-6 w-6 text-white' })}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
                                    <p className="text-sm text-slate-500">{extractedStats?.user_fullname || 'Your Report'} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" data-html2canvas-ignore>
                                <button
                                    onClick={handleShare}
                                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="h-4 w-4 text-slate-600" />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${config.gradient} text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
                                >
                                    <Download className="h-4 w-4" /> Download
                                </button>
                            </div>
                        </div>

                        {/* Tool Specific Views (Enhanced) */}
                        {toolId === 'ats-checker' && <ATSResult data={resultData} />}
                        {toolId === 'netflix-career' && <NetflixResult data={resultData} />}
                        {toolId === 'wikipedia-page' && <WikipediaResult data={resultData} />}
                        {toolId === 'resume-roast' && <RoastResult data={resultData} />}
                        {toolId === 'job-search-strategy' && <StrategyResult data={resultData} />}
                        {toolId === 'interview-predictor' && <PredictorResult data={resultData} />}
                        {toolId === 'buzzword-detector' && <BuzzwordResult data={resultData} />}
                        {toolId === 'killer-self-intro' && <IntroResult data={resultData} />}

                        {!['ats-checker', 'netflix-career', 'wikipedia-page', 'resume-roast', 'job-search-strategy', 'interview-predictor', 'buzzword-detector', 'killer-self-intro'].includes(toolId) && (
                            <FallbackResult data={resultData} />
                        )}

                        {/* Premium CTA Section */}
                        <div className="mt-8 bg-slate-900 rounded-xl p-8 text-center" data-html2canvas-ignore>
                            <div className="max-w-2xl mx-auto space-y-4">
                                <h2 className="text-xl md:text-2xl font-bold text-white">
                                    Ready to land interviews faster?
                                </h2>
                                <p className="text-sm text-slate-400">
                                    Our premium service tailors your resume for each job, writes custom cover letters, and helps you apply at scale.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    {['AI-Tailored Resumes', 'Custom Cover Letters', 'ATS Optimization'].map((feature, i) => (
                                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/80">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-3 pt-4">
                                    <button
                                        onClick={() => router.push('/#pricing')}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        View Plans <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <a
                                        href="https://cal.id/krishna-chaitanya/connect-with-founder"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Book a call
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/* --- Refined Result Components --- */

function ATSResult({ data }: { data: any }) {
    return (
        <div className="space-y-6">
            {/* Score and Summary Row */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Score Card */}
                <div className="md:w-48 shrink-0 rounded-xl p-6 text-center" style={{ background: 'linear-gradient(to bottom right, #ecfdf5, #f0fdfa)', border: '1px solid #d1fae5' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#059669' }}>ATS Score</p>
                    <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-black" style={{ color: '#0f172a' }}>{data.score}</span>
                        <span className="text-lg font-bold" style={{ color: '#94a3b8' }}>/100</span>
                    </div>
                    <p className="text-xs font-medium mt-2" style={{ color: '#059669' }}>{data.industry_benchmark}</p>
                </div>
                {/* Summary */}
                <div className="flex-1 rounded-xl p-6" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Summary</p>
                    <p className="text-base leading-relaxed" style={{ color: '#334155' }}>{data.executive_summary}</p>
                </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: '#059669' }}>
                        <CheckCircle2 className="h-4 w-4" /> Strengths
                    </h4>
                    <ul className="space-y-3">
                        {data.key_strengths?.map((s: any, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#10b981' }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{s.category}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: '#d97706' }}>
                        <Target className="h-4 w-4" /> Areas to Improve
                    </h4>
                    <ul className="space-y-3">
                        {data.critical_optimization_points?.map((s: any, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{s.area}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.suggestion}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function NetflixResult({ data }: { data: any }) {
    return (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
            {/* Header */}
            <div className="px-6 py-4" style={{ background: 'linear-gradient(to right, #e11d48, #ea580c)' }}>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.8)' }}>N</span>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#ffffff' }}>Series</span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Title and Tagline */}
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#ffffff' }}>{data.series_title}</h2>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>{data.premium_tagline}</p>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: '#94a3b8' }}>
                    <span className="font-semibold" style={{ color: '#34d399' }}>98% Match</span>
                    <span>{data.genre || 'Drama'}</span>
                    <span>{data.seasons?.length || 3} Seasons</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ border: '1px solid #475569' }}>HD</span>
                </div>

                {/* Summary */}
                <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{data.show_runner_summary}</p>

                {/* Starring */}
                <div className="text-xs" style={{ color: '#94a3b8' }}>
                    <span style={{ color: '#64748b' }}>Starring:</span> {data.lead_character_profile?.name || 'You'}
                </div>

                {/* Episodes */}
                <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #1e293b' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Episodes</h3>
                    {data.seasons?.map((s: any, i: number) => (
                        <div key={i} className="flex gap-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                            <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: '#334155', color: '#ffffff' }}>
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{s.season_title}</p>
                                <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>{s.plot_arc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function WikipediaResult({ data }: { data: any }) {
    return (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            {/* Wikipedia-style header */}
            <div className="px-6 py-3 flex items-center gap-2" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Globe className="h-4 w-4" style={{ color: '#94a3b8' }} />
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Wikipedia</span>
            </div>

            <div className="p-6 space-y-6">
                {/* Title */}
                <h1 className="text-2xl font-serif font-bold pb-3" style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                    {data.title}
                </h1>

                {/* Lead paragraph */}
                <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
                    {data.lead_paragraph}
                </p>

                {/* Infobox - compact sidebar style */}
                {data.infobox && Object.keys(data.infobox).length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <table className="w-full text-xs">
                            <tbody>
                                {Object.entries(data.infobox).slice(0, 6).map(([key, value]: any, i) => (
                                    <tr key={i} style={{ borderBottom: i < Object.entries(data.infobox).slice(0, 6).length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <th className="py-2 pr-3 text-left font-semibold capitalize w-1/3" style={{ color: '#64748b' }}>
                                            {key.replace(/_/g, ' ')}
                                        </th>
                                        <td className="py-2" style={{ color: '#334155' }}>
                                            {Array.isArray(value) ? value.join(', ') : value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sections */}
                <div className="space-y-5">
                    {data.sections?.map((s: any, i: number) => (
                        <div key={i}>
                            <h2 className="text-lg font-serif font-semibold pb-1 mb-2" style={{ color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>
                                {s.heading}
                            </h2>
                            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{s.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RoastResult({ data }: { data: any }) {
    return (
        <div className="space-y-5">
            {/* Opening Roast */}
            <div className="rounded-xl p-6" style={{ background: 'linear-gradient(to right, #f97316, #ef4444)', color: '#ffffff' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4" style={{ color: '#ffffff' }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.8)' }}>Roast Level: {data.roast_level}</span>
                </div>
                <p className="text-xl font-bold leading-tight" style={{ color: '#ffffff' }}>"{data.opening_salvo}"</p>
            </div>

            {/* Critiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.savage_critiques?.map((s: any, i: number) => (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffedd5' }}>
                                <span className="text-xs font-bold" style={{ color: '#ea580c' }}>{i + 1}</span>
                            </div>
                            <span className="text-xs font-semibold uppercase" style={{ color: '#ea580c' }}>{s.target}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{s.roast}</p>
                    </div>
                ))}
            </div>

            {/* Industry Opinion & Redemption */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Industry Take</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{data.industry_opinion}</p>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#059669' }}>How to Fix It</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{data.redemption_path}</p>
                </div>
            </div>
        </div>
    );
}

function StrategyResult({ data }: { data: any }) {
    return (
        <div className="space-y-5">
            {/* Objective */}
            <div className="rounded-xl p-5" style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', color: '#ffffff' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Your 30-Day Goal</p>
                <p className="text-lg font-bold" style={{ color: '#ffffff' }}>{data.strategic_objective}</p>
                {data.target_companies_types && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {data.target_companies_types.map((t: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>{t}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Weekly Plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.weeks?.map((w: any, i: number) => (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                W{i + 1}
                            </div>
                            <h4 className="text-sm font-semibold" style={{ color: '#1e293b' }}>{w.week_name}</h4>
                        </div>
                        <ul className="space-y-2">
                            {w.primary_actions?.slice(0, 4).map((action: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                                    <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#818cf8' }} />
                                    <span className="line-clamp-2">{action}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Outreach Scripts */}
            {data.reach_out_scripts && data.reach_out_scripts.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: '#334155' }}>Outreach Templates</h4>
                    {data.reach_out_scripts.map((script: any, i: number) => (
                        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase" style={{ color: '#4f46e5' }}>{script.style || 'Template'}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(script.script);
                                        toast.success('Copied!');
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                                    style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}
                                >
                                    <Copy className="h-3 w-3" /> Copy
                                </button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed" style={{ color: '#475569' }}>{script.script}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PredictorResult({ data }: { data: any }) {
    const getTypeStyle = (type: string) => {
        if (type === 'Technical') return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
        if (type === 'Behavioral') return { backgroundColor: '#f3e8ff', color: '#7c3aed' };
        return { backgroundColor: '#fef3c7', color: '#b45309' };
    };

    return (
        <div className="space-y-5">
            {/* Score and Warning Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2563eb' }}>Readiness Score</p>
                    <p className="text-4xl font-black" style={{ color: '#0f172a' }}>{data.confidence_score}%</p>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>Interview success probability</p>
                </div>
                {data.red_flag_warning && (
                    <div className="rounded-xl p-5" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="h-4 w-4" style={{ color: '#f43f5e' }} />
                            <span className="text-xs font-semibold uppercase" style={{ color: '#e11d48' }}>Watch Out</span>
                        </div>
                        <p className="text-sm" style={{ color: '#334155' }}>{data.red_flag_warning}</p>
                    </div>
                )}
            </div>

            {/* Questions */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: '#334155' }}>Predicted Interview Questions</h4>
                {data.anticipated_questions?.map((q: any, i: number) => (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 px-2 py-1 rounded text-[10px] font-semibold uppercase" style={getTypeStyle(q.type)}>
                                {q.type}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>{q.question}</p>
                                <div className="space-y-2 text-xs" style={{ color: '#475569' }}>
                                    <p><span className="font-medium" style={{ color: '#64748b' }}>Why they ask:</span> {q.why_they_ask}</p>
                                    <div className="rounded-lg p-3" style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}>
                                        <p className="font-medium" style={{ color: '#047857' }}>Suggested approach:</p>
                                        <p className="mt-1" style={{ color: '#065f46' }}>{q.ideal_answer_tip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BuzzwordResult({ data }: { data: any }) {
    return (
        <div className="space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <p className="text-3xl font-black" style={{ color: '#e11d48' }}>{data.buzzword_count}</p>
                    <p className="text-xs font-medium" style={{ color: '#e11d48' }}>Buzzwords Found</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-lg font-bold" style={{ color: '#1e293b' }}>{data.readability_grade}</p>
                    <p className="text-xs font-medium" style={{ color: '#64748b' }}>Readability</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}>
                    <p className="text-lg font-bold" style={{ color: '#047857' }}>{data.words_to_kill?.length || 0}</p>
                    <p className="text-xs font-medium" style={{ color: '#059669' }}>Suggestions</p>
                </div>
            </div>

            {/* Tone Assessment */}
            {data.professional_tone && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Tone Assessment</p>
                    <p className="text-sm" style={{ color: '#334155' }}>{data.professional_tone}</p>
                </div>
            )}

            {/* Words to Replace */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: '#334155' }}>Words to Replace</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.words_to_kill?.map((w: any, i: number) => (
                        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 rounded text-xs font-semibold line-through" style={{ backgroundColor: '#ffe4e6', color: '#e11d48' }}>{w.word}</span>
                                <ArrowRight className="h-4 w-4" style={{ color: '#cbd5e1' }} />
                                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#d1fae5', color: '#047857' }}>{w.replacement}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#64748b' }}>{w.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function IntroResult({ data }: { data: any }) {
    return (
        <div className="space-y-5">
            {/* Hook Summary */}
            <div className="rounded-xl p-6 text-center" style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)', color: '#ffffff' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Unique Hook</p>
                <p className="text-xl font-bold leading-tight" style={{ color: '#ffffff' }}>{data.hook_summary}</p>
            </div>

            {/* Intro Scripts */}
            <div className="space-y-4">
                {data.intros?.map((s: any, i: number) => (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold mb-1" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>{s.style}</span>
                                <p className="text-xs" style={{ color: '#64748b' }}>{s.best_used_for}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(s.script);
                                    toast.success('Copied!');
                                }}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                                style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                            >
                                <Copy className="h-3.5 w-3.5" /> Copy
                            </button>
                        </div>
                        <p className="text-sm leading-relaxed rounded-lg p-4" style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #f1f5f9' }}>
                            "{s.script}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FallbackResult({ data }: { data: any }) {
    return (
        <div className="space-y-5">
            {/* Overall Impression */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Summary</p>
                <p className="text-base leading-relaxed" style={{ color: '#334155' }}>{data.overall_impression}</p>
            </div>

            {/* Key Differentiators */}
            {data.key_differentiators && data.key_differentiators.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {data.key_differentiators.map((d: any, i: number) => (
                        <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                            <p className="text-sm font-semibold" style={{ color: '#334155' }}>{d}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Suggested Narrative */}
            {data.suggested_narrative && (
                <div className="rounded-xl p-5" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Suggested Narrative</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>{data.suggested_narrative}</p>
                </div>
            )}
        </div>
    );
}

import { Sparkles, Zap, Gift } from 'lucide-react';

export function ToolsHero() {
    return (
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-100/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-full blur-3xl opacity-60" />
            </div>

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
                    <div className="hidden md:flex gap-2 items-center">
                        <a href="/#how-it-works" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            How it Works
                        </a>
                        <a href="/tools" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50/50 rounded-lg transition-colors">
                            Free Tools
                        </a>
                        <a href="/#pricing" className="relative px-5 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-2">
                            Pricing
                            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
                        </a>
                        <a
                            href="https://cal.id/krishna-chaitanya/connect-with-founder"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors ml-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Book Free Call
                        </a>
                        <button
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 ml-1"
                            onClick={() => window.open('https://app.resumetojobs.com', '_blank')}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 text-center py-16 md:py-20 px-4 mt-20">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full mb-2">
                        <Gift className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">100% Free - No Credit Card Required</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
                        AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Career Tools</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                        Professional tools to supercharge your job search. Analyze resumes, prepare for interviews, and stand out from the competition.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-slate-700">AI-Powered Analysis</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                            <Zap className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-slate-700">Instant Results</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-700">Downloadable Reports</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

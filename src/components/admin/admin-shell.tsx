'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
    BarChart3,
    Briefcase,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface AdminShellProps {
    children: React.ReactNode;
    userRole: string;
}

export function AdminShell({ children, userRole }: AdminShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isMaster = userRole === 'master';

    const navItems = [
        ...(isMaster ? [
            { href: '/master', icon: BarChart3, label: 'Overview' },
            { href: '/master?tab=performance', icon: Shield, label: 'Reports' },
        ] : []),
        { href: '/admin/tasks', icon: Briefcase, label: 'Tasks' },
        ...(!isMaster ? [
            { href: '/admin/tasks?tab=reports', icon: BarChart3, label: 'Reports' },
        ] : []),
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden w-full" suppressHydrationWarning>
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-slate-900 text-white flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl z-50 flex-shrink-0 border-r border-slate-800/50",
                    isCollapsed ? "w-[80px]" : "w-[260px]"
                )}
                suppressHydrationWarning
            >
                <div className="flex items-center h-24 px-6 border-b border-white/5" suppressHydrationWarning>
                    <div className={cn(
                        "flex items-center gap-4 transition-all duration-500",
                        isCollapsed ? "mx-auto" : ""
                    )} suppressHydrationWarning>
                        <div className={cn(
                            "h-10 w-10 rounded-[14px] flex items-center justify-center font-black italic shadow-lg flex-shrink-0 transition-transform duration-500",
                            isMaster ? "bg-purple-600 shadow-purple-500/20" : "bg-blue-600 shadow-blue-500/20",
                            isCollapsed ? "scale-90" : "scale-100"
                        )} suppressHydrationWarning>
                            {isMaster ? 'M' : 'A'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500" suppressHydrationWarning>
                                <span className="font-black tracking-tight text-lg uppercase italic leading-none truncate w-32">
                                    {isMaster ? 'Master Hub' : 'Admin Hub'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intelligence</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide pt-8">
                    {navItems.map((item) => {
                        const [basePath, query] = item.href.split('?');
                        const params = new URLSearchParams(query);
                        const tab = params.get('tab');
                        const currentTab = searchParams.get('tab');

                        const isActive = pathname === basePath && currentTab === tab;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-[18px] transition-all duration-300 group relative",
                                    isActive
                                        ? "bg-white/10 text-white shadow-xl shadow-black/20"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className={cn(
                                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full",
                                        isMaster ? "bg-purple-500" : "bg-blue-500"
                                    )} suppressHydrationWarning />
                                )}

                                <item.icon className={cn(
                                    "h-5 w-5 flex-shrink-0 transition-all duration-500",
                                    isActive
                                        ? (isMaster ? "text-purple-400 scale-110" : "text-blue-400 scale-110")
                                        : "text-slate-600 group-hover:text-slate-300 group-hover:scale-110"
                                )} />

                                {!isCollapsed && (
                                    <span className="text-[13px] font-black italic uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                                        {item.label}
                                    </span>
                                )}

                                {isCollapsed && (
                                    <div className="absolute left-[90px] px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/5 ring-1 ring-white/5 transform translate-x-2 group-hover:translate-x-0" suppressHydrationWarning>
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 flex flex-col gap-4" suppressHydrationWarning>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center h-12 rounded-[18px] bg-white/5 hover:bg-white/10 transition-all duration-300 text-slate-500 hover:text-white border border-white/5 group active:scale-95"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-5 w-5 transition-transform duration-300 transform group-hover:translate-x-0.5" />
                        ) : (
                            <div className="flex items-center gap-2" suppressHydrationWarning>
                                <ChevronLeft className="h-5 w-5 transition-transform duration-300 transform group-hover:-translate-x-0.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic animate-in fade-in duration-500">Collapse Panel</span>
                            </div>
                        )}
                    </button>

                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-[22px] bg-slate-800/30 border border-white/5 transition-all duration-500",
                        isCollapsed ? "justify-center" : ""
                    )} suppressHydrationWarning>
                        <div className="relative" suppressHydrationWarning>
                            <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse" suppressHydrationWarning />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-500 overflow-hidden" suppressHydrationWarning>
                                <span className="text-[10px] font-black text-white uppercase tracking-tight leading-none italic">Secure Protocol</span>
                                <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Access {userRole}</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden h-full",
                )}
                suppressHydrationWarning
            >
                <div className="h-full w-full overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-slate-200" suppressHydrationWarning>
                    <div className="min-w-0 max-w-full" suppressHydrationWarning>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

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
    const [isCollapsed, setIsCollapsed] = useState(true);
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
        <div className="flex h-screen bg-slate-50 overflow-hidden w-full relative" suppressHydrationWarning>
            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}
                className={cn(
                    "bg-white text-slate-900 flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[20px_0_50px_-20px_rgba(0,0,0,0.05)] z-50 flex-shrink-0 border-r border-slate-100 relative group",
                    isCollapsed ? "w-[90px]" : "w-[280px]"
                )}
                suppressHydrationWarning
            >
                {/* Glassy Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />

                <div className="flex items-center h-28 px-7 relative z-10" suppressHydrationWarning>
                    <div className={cn(
                        "flex items-center gap-4 transition-all duration-500",
                        isCollapsed ? "mx-auto" : ""
                    )} suppressHydrationWarning>
                        <div className={cn(
                            "h-12 w-12 rounded-[20px] flex items-center justify-center font-black italic shadow-2xl flex-shrink-0 transition-all duration-500 rotate-3 group-hover:rotate-0",
                            isMaster
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200"
                                : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200",
                            isCollapsed ? "scale-90" : "scale-100"
                        )} suppressHydrationWarning>
                            <span className="text-white text-xl drop-shadow-md">{isMaster ? 'M' : 'A'}</span>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500" suppressHydrationWarning>
                                <span className="font-black tracking-tighter text-xl uppercase italic leading-none text-slate-900">
                                    {isMaster ? 'Master Hub' : 'Admin Hub'}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Intelligence
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-5 space-y-2.5 overflow-y-auto scrollbar-hide pt-4 relative z-10">
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
                                    "flex items-center gap-4 px-4 py-4 rounded-[22px] transition-all duration-500 group/nav relative overflow-hidden",
                                    isActive
                                        ? "bg-slate-900 text-white shadow-[0_15px_30px_-10px_rgba(15,23,42,0.3)]"
                                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && !isCollapsed && (
                                    <div className={cn(
                                        "absolute right-0 top-0 bottom-0 w-1",
                                        isMaster ? "bg-indigo-500" : "bg-blue-500"
                                    )} suppressHydrationWarning />
                                )}

                                <div className={cn(
                                    "h-6 w-6 flex items-center justify-center transition-all duration-500",
                                    isActive ? "scale-110" : "group-hover/nav:scale-110"
                                )}>
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-colors duration-500",
                                        isActive
                                            ? (isMaster ? "text-indigo-400" : "text-blue-400")
                                            : "text-slate-400 group-hover/nav:text-slate-600"
                                    )} />
                                </div>

                                {!isCollapsed && (
                                    <span className="text-[11px] font-black italic uppercase tracking-[0.15em] whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-500 flex-1">
                                        {item.label}
                                    </span>
                                )}

                                {isCollapsed && (
                                    <div className="absolute left-[85px] px-5 py-3 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl opacity-0 group-hover/nav:opacity-100 transition-all duration-500 pointer-events-none whitespace-nowrap z-[60] shadow-2xl border border-white/10 transform translate-x-4 group-hover/nav:translate-x-0 italic" suppressHydrationWarning>
                                        {item.label}
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-950 rotate-45 border-l border-b border-white/10" />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 flex flex-col gap-5 relative z-10" suppressHydrationWarning>
                    <div className={cn(
                        "flex items-center gap-4 p-5 rounded-[28px] bg-slate-50 border border-slate-100 transition-all duration-700 relative overflow-hidden group/protocol",
                        isCollapsed ? "justify-center px-0 bg-transparent border-transparent" : "shadow-sm hover:shadow-md hover:bg-white"
                    )} suppressHydrationWarning>
                        <div className="relative z-10" suppressHydrationWarning>
                            <ShieldCheck className={cn(
                                "h-6 w-6 transition-all duration-500",
                                isCollapsed ? "text-slate-300 group-hover/protocol:text-emerald-500" : "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            )} />
                            {(!isCollapsed) && (
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" suppressHydrationWarning />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-700 overflow-hidden relative z-10" suppressHydrationWarning>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none italic">Secure Protocol</span>
                                <span className="text-[8px] font-black text-indigo-500/80 uppercase tracking-[0.25em] mt-1.5 whitespace-nowrap">Access {userRole === 'master' ? 'System Root' : 'Admin Node'}</span>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="absolute left-[85px] px-5 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover/protocol:opacity-100 transition-all duration-500 pointer-events-none whitespace-nowrap z-[60] shadow-2xl border border-emerald-500/20 transform translate-x-4 group-hover/protocol:translate-x-0 italic shadow-emerald-500/20" suppressHydrationWarning>
                                Encrypted Access Only
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden h-full z-0",
                )}
                suppressHydrationWarning
            >
                <div className="h-full w-full overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50" suppressHydrationWarning>
                    <div className="min-w-0 max-w-full p-0" suppressHydrationWarning>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

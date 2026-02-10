'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import {
    BarChart3,
    Briefcase,
    ShieldCheck,
    MoreVertical,
    Shield,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface AdminShellProps {
    children: React.ReactNode;
    userRole: string;
}

export function AdminShell({ children, userRole }: AdminShellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
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

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname, searchParams]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden w-full relative" suppressHydrationWarning>
            {/* Top Bar with 3-dot menu */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 flex-shrink-0 relative z-50" suppressHydrationWarning>
                {/* Left: Hub branding */}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center font-black italic shadow-lg flex-shrink-0",
                        isMaster
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200/50"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200/50"
                    )}>
                        <span className="text-white text-sm drop-shadow-md">{isMaster ? 'M' : 'A'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black tracking-tight text-sm uppercase italic leading-none text-slate-900">
                            {isMaster ? 'Master Hub' : 'Admin Hub'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            Intelligence
                        </span>
                    </div>
                </div>

                {/* Right: 3-dot menu trigger */}
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                            isOpen
                                ? "bg-slate-900 text-white shadow-lg"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        {isOpen ? <X className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                            suppressHydrationWarning
                        >
                            {/* Nav Items */}
                            <nav className="p-2 space-y-1">
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
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group/nav relative",
                                                isActive
                                                    ? "bg-slate-900 text-white shadow-md"
                                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-4 w-4 transition-colors duration-300",
                                                isActive
                                                    ? (isMaster ? "text-indigo-400" : "text-blue-400")
                                                    : "text-slate-400 group-hover/nav:text-slate-600"
                                            )} />
                                            <span className="text-xs font-black italic uppercase tracking-[0.1em]">
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <div className={cn(
                                                    "ml-auto h-1.5 w-1.5 rounded-full",
                                                    isMaster ? "bg-indigo-400" : "bg-blue-400"
                                                )} />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Secure Protocol Footer */}
                            <div className="border-t border-slate-100 p-3">
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight italic">Secure Protocol</span>
                                        <span className="text-[7px] font-bold text-indigo-500/80 uppercase tracking-[0.2em]">
                                            Access {userRole === 'master' ? 'System Root' : 'Admin Node'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop overlay when menu is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/5 z-40 backdrop-blur-[1px]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Main Content Area - full width */}
            <main className="flex-1 min-w-0 relative overflow-hidden h-full z-0" suppressHydrationWarning>
                <div className="h-full w-full overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50" suppressHydrationWarning>
                    <div className="min-w-0 max-w-full p-0" suppressHydrationWarning>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

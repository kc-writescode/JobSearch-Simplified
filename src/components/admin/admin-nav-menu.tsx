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

interface AdminNavMenuProps {
    userRole: string;
}

export function AdminNavMenu({ userRole }: AdminNavMenuProps) {
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

    useEffect(() => {
        setIsOpen(false);
    }, [pathname, searchParams]);

    return (
        <>
            <div ref={menuRef} className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        isOpen
                            ? "bg-slate-900 text-white shadow-lg"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    )}
                >
                    {isOpen ? <X className="h-3.5 w-3.5" /> : <MoreVertical className="h-3.5 w-3.5" />}
                </button>

                {isOpen && (
                    <div
                        className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                        suppressHydrationWarning
                    >
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

            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

'use client';

import React from 'react';

interface AdminShellProps {
    children: React.ReactNode;
    userRole: string;
}

export function AdminShell({ children }: AdminShellProps) {
    return (
        <div className="h-screen bg-slate-50 overflow-hidden w-full relative" suppressHydrationWarning>
            <main className="h-full w-full overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50" suppressHydrationWarning>
                <div className="min-w-0 max-w-full p-0" suppressHydrationWarning>
                    {children}
                </div>
            </main>
        </div>
    );
}

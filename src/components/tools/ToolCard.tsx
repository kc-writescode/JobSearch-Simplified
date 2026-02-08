import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    userCount?: string;
    isNew?: boolean;
    isComingSoon?: boolean;
    onClick: () => void;
    color: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate';
}

const colorMap = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 shadow-sm group-hover:shadow-blue-100',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 shadow-sm group-hover:shadow-purple-100',
    emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 shadow-sm group-hover:shadow-emerald-100',
    rose: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50 shadow-sm group-hover:shadow-rose-100',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 shadow-sm group-hover:shadow-amber-100',
    indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 shadow-sm group-hover:shadow-indigo-100',
    slate: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 shadow-sm group-hover:shadow-slate-100',
};

const hoverColorMap = {
    blue: 'hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/50',
    purple: 'hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100/50',
    emerald: 'hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/50',
    rose: 'hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100/50',
    amber: 'hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50',
    indigo: 'hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50',
    slate: 'hover:border-slate-400 hover:shadow-lg hover:shadow-slate-100/50',
};

const buttonColorMap = {
    blue: 'group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600',
    purple: 'group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
    emerald: 'group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
    rose: 'group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600',
    amber: 'group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600',
    indigo: 'group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600',
    slate: 'group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800',
};

export function ToolCard({ title, description, icon, userCount, isNew, isComingSoon, onClick, color }: ToolCardProps) {
    return (
        <div
            onClick={!isComingSoon ? onClick : undefined}
            className={`group relative bg-white p-6 rounded-2xl border border-slate-200 transition-all duration-300 flex flex-col h-full ${isComingSoon ? 'opacity-70 grayscale-[0.5]' : `${hoverColorMap[color]} hover:-translate-y-1 cursor-pointer`}`}
        >
            {/* Subtle gradient overlay on hover */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-${color}-50/30 to-transparent`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                    <div className={`h-14 w-14 flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 ${colorMap[color]} group-hover:scale-110`}>
                        {React.cloneElement(icon as React.ReactElement, { className: 'h-8 w-8' })}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {isNew && (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-200 shadow-sm">
                                <Sparkles className="w-3 h-3" />
                                New
                            </span>
                        )}
                        {isComingSoon && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">Soon</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-2 mb-5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-slate-800">
                        {title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        {description}
                    </p>
                </div>

                {!isComingSoon && (
                    <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 transition-all duration-300 ${buttonColorMap[color]}`}>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 group-hover:text-white transition-colors">Try Now - Free</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                )}
            </div>
        </div>
    );
}

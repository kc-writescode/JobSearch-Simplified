'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DeploymentCalendarProps {
    dailyStats: Record<string, number>;
    title?: string;
}

export function DeploymentCalendar({ dailyStats, title = "Operational Throughput" }: DeploymentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    // Calculate total for visible month
    let monthTotal = 0;
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    Object.keys(dailyStats).forEach(date => {
        if (date.startsWith(monthPrefix)) {
            monthTotal += dailyStats[date];
        }
    });

    // Find max count for relative heat mapping
    const monthCounts = Object.entries(dailyStats)
        .filter(([date]) => date.startsWith(monthPrefix))
        .map(([, count]) => count);
    const maxCount = Math.max(...monthCounts, 1);

    const days = [];
    // Padding for first day
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`pad-${i}`} className="h-14 bg-slate-50/30 rounded-lg" suppressHydrationWarning></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = dailyStats[dateStr] || 0;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const heatColor = count > 10 ? 'bg-purple-500' : count > 5 ? 'bg-blue-500' : 'bg-emerald-500';

        days.push(
            <div
                key={d}
                className={`h-14 p-1.5 border rounded-lg transition-all group relative overflow-hidden flex flex-col ${isToday
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                    : count > 0 ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm' : 'bg-white border-slate-100'
                    }`}
                suppressHydrationWarning
            >
                <div className="flex justify-between items-center" suppressHydrationWarning>
                    <span className={`text-[10px] font-bold leading-none ${isToday ? 'text-blue-600' : count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                        {d}
                    </span>
                    {count > 0 && (
                        <span className={`text-[10px] font-black ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                            {count}
                        </span>
                    )}
                </div>

                {/* Heat bar at bottom */}
                {count > 0 && (
                    <div className="mt-auto" suppressHydrationWarning>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${heatColor} transition-all duration-500`}
                                style={{ width: `${Math.max((count / maxCount) * 100, 15)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm border-b-4 border-b-slate-200 overflow-hidden" suppressHydrationWarning>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" suppressHydrationWarning>
                <div className="flex items-center gap-3" suppressHydrationWarning>
                    <div className="p-2 bg-slate-900 rounded-xl text-white shadow-sm" suppressHydrationWarning>
                        <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div suppressHydrationWarning>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase italic">{title}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {monthName} {year} <span className="mx-1.5 text-slate-300">|</span> <span className="text-blue-600 font-black">{monthTotal} Total</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5" suppressHydrationWarning>
                    <button onClick={prevMonth} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={nextMonth} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="p-4" suppressHydrationWarning>
                <div className="grid grid-cols-7 gap-1.5 mb-2" suppressHydrationWarning>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[8px] font-black uppercase tracking-widest text-slate-400" suppressHydrationWarning>
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5" suppressHydrationWarning>
                    {days}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-4 mt-3 px-1" suppressHydrationWarning>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">1-5</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">6-10</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">10+</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

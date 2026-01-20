'use client';

import React, { useState, useEffect } from 'react';
import { TasksDataTable } from '@/components/admin/tasks-data-table';
import { ApplicationWorkspace } from '@/components/admin/application-workspace';
import { VACoreTask, TaskFilters, TaskStatus, ClientPriority } from '@/types/admin.types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

const statuses: TaskStatus[] = ['Applying', 'Applied'];
const priorities: ClientPriority[] = ['Standard', 'Premium'];


export default function VATasksPage() {
  const [tasks, setTasks] = useState<VACoreTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<VACoreTask[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'Applying' | 'Applied'>('Applying');
  const [selectedTask, setSelectedTask] = useState<VACoreTask | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: ['Applying'],
    priority: [],
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!hasInitialized) {
      fetchTasks();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Refetch when filters change (but not on initial mount)
  useEffect(() => {
    if (hasInitialized) {
      fetchTasks();
    }
  }, [filters, hasInitialized]);

  // Auto-refresh every 30 minutes to catch new tasks
  useEffect(() => {
    if (!hasInitialized) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 1800000);

    return () => clearInterval(interval);
  }, [hasInitialized, filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.priority && filters.priority.length > 0) {
        filters.priority.forEach(p => params.append('priority', p));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const url = `/api/admin/tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result = await response.json();
      setTasks(result.data || []);
      setFilteredTasks(result.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (proofOfWork: {
    screenshotUrl?: string;
    submissionLink?: string;
  }) => {
    if (!selectedTask) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Applied', proofOfWork }),
      });

      if (!response.ok) throw new Error('Failed to submit task');

      const updated = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, status: 'Applied' as TaskStatus, proofOfWork }
          : task
      );
      setTasks(updated);
      setFilteredTasks(updated);
      setSelectedTask(null);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeFilterCount = (filters.status?.length || 0) + (filters.priority?.length || 0);

  const handleTabChange = (tab: 'Applying' | 'Applied') => {
    setDashboardTab(tab);
    setFilters({ ...filters, status: [tab] });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Area */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30 shadow-sm shadow-slate-200/20 backdrop-blur-xl bg-white/90">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-10">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 italic text-white text-xs">VA</div>
                  Application Tasks
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Sync On</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => handleTabChange('Applying')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${dashboardTab === 'Applying'
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200 border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleTabChange('Applied')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${dashboardTab === 'Applied'
                    ? 'bg-white text-emerald-600 shadow-md shadow-slate-200 border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Submitted
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-xl relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-[0.95] shadow-sm relative group"
                title="Sync Feed"
              >
                <RefreshIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                {loading && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span></span>}
              </button>

              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                <span className="text-sm font-black text-slate-900 leading-none">
                  {tasks.filter(t => t.status === 'Applying').length}
                </span>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

              <button
                onClick={handleSignOut}
                className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl hover:bg-red-100 transition-all active:scale-[0.95] shadow-sm"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-8 py-8 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-1 rounded-full ${dashboardTab === 'Applying' ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {dashboardTab === 'Applying' ? 'Active Tasks' : 'Submitted Tasks'}
            </h2>
            <span className="px-2.5 py-1 bg-slate-200/50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
              {filteredTasks.length} Items
            </span>
          </div>

          <div className="flex gap-4">
            <StatsCard
              label="Standard"
              value={filteredTasks.filter(t => t.priority !== 'Premium').length}
              color="slate"
            />
            <StatsCard
              label="Priority"
              value={filteredTasks.filter(t => t.priority === 'Premium').length}
              color="purple"
              icon="⭐"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TasksDataTable
            tasks={filteredTasks}
            loading={loading}
            onSelectTask={setSelectedTask}
            selectedTaskId={selectedTask?.id}
          />
        </div>
      </main>

      {/* Application Workspace Slide-over */}
      <ApplicationWorkspace
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSubmit={handleSubmitTask}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function StatsCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
    slate: 'text-slate-600',
  };

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-black ${colorMap[color] || 'text-slate-900'}`}>{value}</span>
        {icon && <span className="text-xs">{icon}</span>}
      </div>
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

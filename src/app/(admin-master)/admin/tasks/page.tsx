'use client';

import React, { useState, useEffect } from 'react';
import { TasksDataTable } from '@/components/admin/tasks-data-table';
import { ApplicationWorkspace } from '@/components/admin/application-workspace';
import { CannotApplyDialog } from '@/components/admin/cannot-apply-dialog';
import { VACoreTask, TaskFilters, TaskStatus } from '@/types/admin.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LogOut, Trash2, BarChart3, Users, LayoutDashboard, Calendar, Tag, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, AlertTriangle } from 'lucide-react';
import { getLabelClasses } from '@/lib/constants/labels';
import { DeploymentCalendar } from '@/components/admin/deployment-calendar';

const statuses: TaskStatus[] = ['Applying', 'Applied'];


export default function VATasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<VACoreTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<VACoreTask[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'Applying' | 'Applied' | 'Trashed' | 'Reports' | 'Overdue'>('Applying');
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reports') {
      setDashboardTab('Reports');
    } else if (tab === 'applied') {
      setDashboardTab('Applied');
      setFilters(prev => ({ ...prev, status: ['Applied'] }));
    } else if (tab === 'trashed') {
      setDashboardTab('Trashed');
      setFilters(prev => ({ ...prev, status: ['Trashed'] }));
    } else if (tab === 'overdue') {
      setDashboardTab('Overdue');
      setFilters(prev => ({ ...prev, status: ['Overdue'] }));
    } else {
      setDashboardTab('Applying');
      setFilters(prev => ({ ...prev, status: ['Applying'] }));
    }
  }, [searchParams]);
  const [selectedTask, setSelectedTask] = useState<VACoreTask | null>(null);
  const [adminProfile, setAdminProfile] = useState<{ id: string, full_name: string, email: string, role: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: ['Applying'],
    priority: [],
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [cannotApplyTask, setCannotApplyTask] = useState<VACoreTask | null>(null);
  const [selectedLabelFilters, setSelectedLabelFilters] = useState<string[]>([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  // Initial fetch on mount
  useEffect(() => {
    if (!hasInitialized) {
      fetchTasks();
      fetchAdminContext();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const fetchAdminContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', user.id).single();
      setAdminProfile(profile as any);

      // Fetch performance for this specific admin
      const perfRes = await fetch('/api/admin/reports/performance', { cache: 'no-store' });
      const perfData = await perfRes.json();
      const myStats = perfData.adminStats?.find((s: any) => s.id === user.id);
      setPerformanceData(myStats);
    }
  };

  // Refetch when filters change (but not on initial mount) - reset to page 1
  useEffect(() => {
    if (hasInitialized && dashboardTab !== 'Reports') {
      setCurrentPage(1);
      fetchTasks(1, pageSize);
    }
  }, [filters, hasInitialized, dashboardTab]);

  // Refetch when pagination changes
  useEffect(() => {
    if (hasInitialized && dashboardTab !== 'Reports') {
      fetchTasks(currentPage, pageSize);
    }
  }, [currentPage, pageSize]);

  // Auto-refresh every 30 minutes to catch new tasks
  useEffect(() => {
    if (!hasInitialized) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 1800000);

    return () => clearInterval(interval);
  }, [hasInitialized, filters]);

  // Redirect to Overdue tab if there are overdue tasks and currently on Active tab
  // This handles the case where page is refreshed while on Active tab
  useEffect(() => {
    if (hasInitialized && overdueCount > 0 && dashboardTab === 'Applying') {
      toast.warning('Priority tasks detected. Redirecting to 24hrs+ tab.');
      setDashboardTab('Overdue');
      setFilters(prev => ({ ...prev, status: ['Overdue'] }));
    }
  }, [overdueCount, hasInitialized]);

  const fetchTasks = async (page = currentPage, limit = pageSize) => {
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
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/api/admin/tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result = await response.json();
      setTasks(result.data || []);
      setFilteredTasks(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.totalPages || 0);
      setOverdueCount(result.overdueCount || 0);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setFilteredTasks([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'Applying' | 'Applied' | 'Trashed' | 'Reports' | 'Overdue') => {
    // Block Active tab if there are overdue tasks globally
    if (tab === 'Applying' && overdueCount > 0) {
      toast.warning('Complete priority tasks (24hrs+) first before accessing Active missions.');
      setDashboardTab('Overdue');
      setFilters({ ...filters, status: ['Overdue'] });
      return;
    }

    setDashboardTab(tab);
    if (tab === 'Reports') {
      fetchAdminContext();
    } else {
      setFilters({ ...filters, status: [tab as TaskStatus] });
    }
  };

  const activeFilterCount = (filters.status?.length || 0) + (filters.priority?.length || 0);

  // Count active claims for the current admin (Applying status, assigned to me)
  const MAX_ACTIVE_CLAIMS = 5;
  const activeClaimCount = currentUserId
    ? tasks.filter(t => t.assignedTo === currentUserId && t.status === 'Applying').length
    : 0;
  const claimLimitReached = activeClaimCount >= MAX_ACTIVE_CLAIMS;

  // Derive all unique labels from current tasks for the filter dropdown
  const allLabels = Array.from(new Set(filteredTasks.flatMap(t => t.labels || [])));

  // Apply label filter on top of filteredTasks, then sort "Apply First" to top
  const labelFiltered = selectedLabelFilters.length > 0
    ? filteredTasks.filter(t => t.labels && selectedLabelFilters.some(l => t.labels!.includes(l)))
    : filteredTasks;

  const displayTasks = [...labelFiltered].sort((a, b) => {
    const aFirst = a.labels?.includes('Apply First') ? 1 : 0;
    const bFirst = b.labels?.includes('Apply First') ? 1 : 0;
    return bFirst - aFirst;
  });

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
      toast.success('Application submitted successfully!');

      // Refresh performance metrics immediately
      fetchAdminContext();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };


  const handleCannotApply = async (reason: string) => {
    if (!cannotApplyTask) return;

    const response = await fetch(`/api/admin/tasks/${cannotApplyTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Trashed', cannotApplyReason: reason }),
    });

    if (!response.ok) throw new Error('Failed to mark as cannot apply');

    // Remove from current list
    const updated = tasks.filter(task => task.id !== cannotApplyTask.id);
    setTasks(updated);
    setFilteredTasks(updated);
  };

  const handleClaimTask = async (task: VACoreTask) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: user.id,
          assignmentStatus: 'assigned',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          toast.warning(errorData.error || 'This mission was just claimed by another agent.');
          fetchTasks();
          return;
        }
        if (response.status === 429) {
          toast.warning(errorData.error || 'You have reached the maximum active claims. Submit existing claims first.');
          return;
        }
        throw new Error(errorData.error || 'Failed to claim task');
      }

      toast.success('Task claimed successfully!');

      // Update local state for immediate UI feedback
      if (selectedTask?.id === task.id) {
        setSelectedTask({
          ...selectedTask,
          assignedTo: user.id,
          assignedToName: adminProfile?.full_name || 'Me',
          assignmentStatus: 'assigned',
        });
      }

      fetchTasks(); // Refresh the list
    } catch (error: any) {
      console.error('System error claiming task:', error);
      toast.error(error.message || 'An unexpected error occurred during claim.');
    }
  };

  return (
    <>
      {/* Header Area */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30 shadow-sm shadow-slate-200/20 backdrop-blur-xl bg-white/90">
        <div className="px-6 py-3" suppressHydrationWarning>
          <div className="flex items-center justify-between gap-4" suppressHydrationWarning>
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <div className={`h-9 w-9 ${adminProfile?.role === 'master' ? 'bg-purple-600' : 'bg-slate-900'} rounded-xl flex items-center justify-center text-white font-black text-[10px] italic shadow-md`} suppressHydrationWarning>
                {adminProfile?.role === 'master' ? 'M' : 'VA'}
              </div>
              <div suppressHydrationWarning>
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase italic">
                  {adminProfile?.full_name || 'Administrator'}
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${adminProfile?.role === 'master' ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                  {adminProfile?.role === 'master' ? 'Master' : 'Agent'}
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50" suppressHydrationWarning>
              <button
                onClick={() => handleTabChange('Applying')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${dashboardTab === 'Applying'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <LayoutDashboard className="h-3 w-3" />
                Active
              </button>
              <button
                onClick={() => handleTabChange('Applied')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${dashboardTab === 'Applied'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Users className="h-3 w-3" />
                Done
              </button>
              <button
                onClick={() => handleTabChange('Overdue')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${dashboardTab === 'Overdue'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-100'
                  : overdueCount > 0
                    ? 'text-orange-600 bg-orange-50 animate-pulse'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Clock className="h-3 w-3" />
                24hrs+
                {overdueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-full">
                    {overdueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('Trashed')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${dashboardTab === 'Trashed'
                  ? 'bg-white text-red-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Trash2 className="h-3 w-3" />
                Trash
              </button>
            </div>

            {dashboardTab !== 'Reports' && (
              <div className="flex-1 flex items-center gap-2 max-w-xl" suppressHydrationWarning>
                <div className="flex-1 relative group" suppressHydrationWarning>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors" suppressHydrationWarning>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Label Filter */}
                {allLabels.length > 0 && (
                  <div className="relative" suppressHydrationWarning>
                    <button
                      onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedLabelFilters.length > 0
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <Tag className="h-3 w-3" />
                      {selectedLabelFilters.length > 0 && (
                        <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{selectedLabelFilters.length}</span>
                      )}
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>

                    {showLabelDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowLabelDropdown(false)} />
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1">
                          {selectedLabelFilters.length > 0 && (
                            <button
                              onClick={() => { setSelectedLabelFilters([]); setShowLabelDropdown(false); }}
                              className="w-full text-left px-2 py-1.5 text-[9px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase"
                            >
                              Clear
                            </button>
                          )}
                          {allLabels.map((label) => {
                            const isActive = selectedLabelFilters.includes(label);
                            return (
                              <button
                                key={label}
                                onClick={() => {
                                  setSelectedLabelFilters(
                                    isActive
                                      ? selectedLabelFilters.filter(l => l !== label)
                                      : [...selectedLabelFilters, label]
                                  );
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg transition-all flex items-center gap-2 ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                                  }`}
                              >
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${getLabelClasses(label)}`}>
                                  {label}
                                </span>
                                {isActive && (
                                  <span className="ml-auto text-blue-600 text-[10px] font-bold">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2" suppressHydrationWarning>
              {dashboardTab !== 'Reports' && (
                <button
                  onClick={() => fetchTasks(currentPage, pageSize)}
                  disabled={loading}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                  title="Refresh"
                >
                  <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Priority Tasks Blocking Banner */}
      {overdueCount > 0 && dashboardTab !== 'Overdue' && dashboardTab !== 'Reports' && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-bold text-sm">
                  {overdueCount} priority {overdueCount === 1 ? 'task' : 'tasks'} need attention
                </p>
                <p className="text-xs text-white/80">
                  These tasks were claimed 24+ hours ago. Complete them first.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTabChange('Overdue')}
              className="px-4 py-2 bg-white text-orange-600 text-xs font-black uppercase rounded-lg hover:bg-orange-50 transition-all"
            >
              View Priority Tasks
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="px-6 py-4 animate-in fade-in duration-500">
        {dashboardTab === 'Reports' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700" suppressHydrationWarning>
            {/* Reports Header */}
            <div className="flex items-center justify-between" suppressHydrationWarning>
              <div className="flex items-center gap-4" suppressHydrationWarning>
                <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200" suppressHydrationWarning>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div suppressHydrationWarning>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Performance Report</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{adminProfile?.full_name || 'Agent'} &mdash; Application Metrics</p>
                </div>
              </div>
              <button
                onClick={fetchAdminContext}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <RefreshIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5" suppressHydrationWarning>
              <StatBox label="Today" value={performanceData?.today || 0} color="emerald" icon={<Calendar className="h-4 w-4" />} />
              <StatBox label="Last 7 Days" value={performanceData?.lastWeek || 0} color="blue" icon={<BarChart3 className="h-4 w-4" />} />
              <StatBox label="This Month" value={performanceData?.thisMonth || 0} color="purple" icon={<BarChart3 className="h-4 w-4" />} />
              <StatBox label="Lifetime" value={performanceData?.total || 0} color="slate" icon={<Users className="h-4 w-4" />} />
            </div>

            {/* Deployment Calendar */}
            <DeploymentCalendar
              dailyStats={performanceData?.dailyStats || {}}
              title={`${adminProfile?.full_name}'s Deployment History`}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3" suppressHydrationWarning>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <div className={`h-5 w-1 rounded-full ${dashboardTab === 'Applying' ? 'bg-blue-600' :
                  dashboardTab === 'Applied' ? 'bg-emerald-600' :
                  dashboardTab === 'Overdue' ? 'bg-orange-500' : 'bg-red-600'
                  }`} suppressHydrationWarning></div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {dashboardTab === 'Applying' ? 'Active' :
                    dashboardTab === 'Applied' ? 'Submitted' :
                    dashboardTab === 'Overdue' ? 'Priority (24hrs+)' : 'Trash'}
                </h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded border border-slate-200">
                  {totalItems}
                </span>
                {dashboardTab === 'Applying' && currentUserId && (
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${claimLimitReached
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                    {activeClaimCount}/{MAX_ACTIVE_CLAIMS}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning>
              <TasksDataTable
                tasks={displayTasks}
                loading={loading}
                onSelectTask={setSelectedTask}
                selectedTaskId={selectedTask?.id}
                onCannotApply={dashboardTab === 'Applying' ? setCannotApplyTask : undefined}
                showCannotApplyReason={dashboardTab === 'Trashed'}
                showProofColumn={dashboardTab === 'Applied'}
                onClaimTask={handleClaimTask}
                currentUserId={adminProfile?.id}
                claimDisabled={claimLimitReached}
                activeClaimCount={activeClaimCount}
                maxClaims={MAX_ACTIVE_CLAIMS}
              />

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-2.5 shadow-sm sticky bottom-2" suppressHydrationWarning>
                  <div className="flex items-center gap-2" suppressHydrationWarning>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value, 10);
                        setPageSize(newSize);
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">/ page</span>
                  </div>

                  <div className="flex items-center gap-1" suppressHydrationWarning>
                    <span className="text-[10px] font-semibold text-slate-500 mr-2">
                      {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                    </span>

                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || loading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="First"
                    >
                      <ChevronsLeft className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Previous"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-black text-blue-700">
                      {currentPage}/{totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Next"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || loading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Last"
                    >
                      <ChevronsRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <ApplicationWorkspace
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSubmit={handleSubmitTask}
        isSubmitting={isSubmitting}
        currentAdminId={currentUserId || adminProfile?.id}
        onClaim={handleClaimTask}
      />

      <CannotApplyDialog
        task={cannotApplyTask}
        open={!!cannotApplyTask}
        onOpenChange={(open) => !open && setCannotApplyTask(null)}
        onConfirm={handleCannotApply}
      />
    </>
  );
}

function StatBox({ label, value, color, icon }: any) {
  const colors: any = {
    emerald: { card: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600' },
    blue: { card: 'bg-blue-50 text-blue-600 border-blue-100', icon: 'bg-blue-100 text-blue-600' },
    purple: { card: 'bg-purple-50 text-purple-600 border-purple-100', icon: 'bg-purple-100 text-purple-600' },
    slate: { card: 'bg-slate-100 text-slate-900 border-slate-200', icon: 'bg-slate-200 text-slate-700' },
  };

  return (
    <div className={`p-6 rounded-[2rem] border ${colors[color].card} shadow-sm group hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden`} suppressHydrationWarning>
      <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">{label}</p>
        {icon && (
          <div className={`p-2 rounded-xl ${colors[color].icon}`} suppressHydrationWarning>
            {icon}
          </div>
        )}
      </div>
      <p className="text-4xl font-black tracking-tighter">{value}</p>
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TasksDataTable } from '@/components/admin/tasks-data-table';
import { VACoreTask, TaskStatus } from '@/types/admin.types';
import { LayoutDashboard, Users, Clock, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TasksTabProps {
    refreshTasks?: () => Promise<void>;
}

export function TasksTab({ refreshTasks }: TasksTabProps) {
    const [currentTab, setCurrentTab] = useState<'Active' | 'Done' | 'Overdue' | 'Trash'>('Active');
    const [selectedTask, setSelectedTask] = useState<VACoreTask | null>(null);
    const [tasks, setTasks] = useState<VACoreTask[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Tab counts
    const [activeCount, setActiveCount] = useState(0);
    const [doneCount, setDoneCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);
    const [trashCount, setTrashCount] = useState(0);

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Bulk selection for trash
    const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch counts for all tabs
    const fetchCounts = async () => {
        try {
            const [activeRes, doneRes, overdueRes, trashRes] = await Promise.all([
                fetch('/api/admin/tasks?status=Applying&limit=1'),
                fetch('/api/admin/tasks?status=Applied&limit=1'),
                fetch('/api/admin/tasks?status=Overdue&limit=1'),
                fetch('/api/admin/tasks?status=Trashed&limit=1'),
            ]);

            const [activeData, doneData, overdueData, trashData] = await Promise.all([
                activeRes.json(),
                doneRes.json(),
                overdueRes.json(),
                trashRes.json(),
            ]);

            setActiveCount(activeData.total || 0);
            setDoneCount(doneData.total || 0);
            setOverdueCount(overdueData.total || 0);
            setTrashCount(trashData.total || 0);
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(1);
        }, 400);
    };

    // Fetch tasks for current tab with pagination
    const fetchTasks = async () => {
        setLoading(true);
        try {
            const statusMap = {
                'Active': 'Applying',
                'Done': 'Applied',
                'Overdue': 'Overdue',
                'Trash': 'Trashed'
            };

            const status = statusMap[currentTab];
            const params = new URLSearchParams({
                status,
                page: currentPage.toString(),
                limit: pageSize.toString(),
            });

            if (searchQuery) {
                params.set('search', searchQuery);
            }

            const response = await fetch(`/api/admin/tasks?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');

            const data = await response.json();
            setTasks(data.data || []);
            setTotalItems(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
            setTasks([]);
            setTotalItems(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Initial load - fetch counts and first page
    useEffect(() => {
        fetchCounts();
        fetchTasks();
    }, []);

    // Clear search and reset on tab change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedTrashIds([]);
        setSearchInput('');
        setSearchQuery('');
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, [currentTab]);

    useEffect(() => {
        fetchTasks();
    }, [currentTab, currentPage, pageSize, searchQuery]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Bulk selection handlers
    const toggleSelectAll = () => {
        if (selectedTrashIds.length === tasks.length) {
            setSelectedTrashIds([]);
        } else {
            // Use task.id (database primary key) not task.jobId
            setSelectedTrashIds(tasks.map(t => t.id));
        }
    };

    const toggleSelectTask = (id: string) => {
        setSelectedTrashIds(prev =>
            prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedTrashIds.length === 0) return;

        if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedTrashIds.length} trashed job(s)? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedTrashIds }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Delete failed');
            }

            toast.success(`${selectedTrashIds.length} job(s) permanently deleted`);
            setSelectedTrashIds([]);

            // Refresh current page and counts
            await Promise.all([fetchTasks(), fetchCounts()]);

            // Call parent refresh if provided
            if (refreshTasks) await refreshTasks();
        } catch (error) {
            console.error('Error deleting jobs:', error);
            toast.error('Failed to delete jobs');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                    <button
                        onClick={() => setCurrentTab('Active')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${currentTab === 'Active'
                            ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Active
                        <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded-full">
                            {activeCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('Done')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${currentTab === 'Done'
                            ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <Users className="h-3.5 w-3.5" />
                        Done
                        <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full">
                            {doneCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('Overdue')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${currentTab === 'Overdue'
                            ? 'bg-white text-orange-600 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        24hrs+
                        <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[8px] font-black rounded-full">
                            {overdueCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('Trash')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${currentTab === 'Trash'
                            ? 'bg-white text-red-600 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Trash
                        <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded-full">
                            {trashCount}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    {/* Search Input */}
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search jobs, clients, companies..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:italic"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Bulk Delete Button for Trash Tab */}
                    {currentTab === 'Trash' && selectedTrashIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete {selectedTrashIds.length} Permanently
                        </button>
                    )}
                </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={`h-5 w-1 rounded-full ${currentTab === 'Active'
                            ? 'bg-blue-600'
                            : currentTab === 'Done'
                                ? 'bg-emerald-600'
                                : currentTab === 'Overdue'
                                    ? 'bg-orange-500'
                                    : 'bg-red-600'
                            }`}
                    ></div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {currentTab === 'Active'
                            ? 'Active Tasks'
                            : currentTab === 'Done'
                                ? 'Completed Tasks'
                                : currentTab === 'Overdue'
                                    ? 'Priority (24hrs+)'
                                    : 'Trashed (Can\'t Apply)'}
                    </h2>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded border border-slate-200">
                        {totalItems}
                    </span>
                </div>
            </div>

            {/* Tasks Table */}
            {tasks.length > 0 ? (
                <>
                    {currentTab === 'Trash' ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/90 backdrop-blur border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedTrashIds.length === tasks.length && tasks.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Client</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Job Title</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cannot Apply Reason</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Trashed At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map(task => (
                                            <tr
                                                key={task.id}
                                                className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${selectedTrashIds.includes(task.id) ? 'bg-red-50/30' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300"
                                                        checked={selectedTrashIds.includes(task.id)}
                                                        onChange={() => toggleSelectTask(task.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{task.clientName || 'Unknown'}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold">{task.clientEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900 text-sm max-w-md truncate">{task.jobTitle}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 font-semibold">{task.company}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-slate-500 max-w-xs truncate">
                                                        {task.cannotApplyReason || 'Not specified'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(task.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <TasksDataTable
                            tasks={tasks}
                            loading={loading}
                            onSelectTask={setSelectedTask}
                            selectedTaskId={selectedTask?.id}
                            showCannotApplyReason={false}
                            showProofColumn={currentTab === 'Done'}
                        />
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-2.5 shadow-sm">
                            <div className="flex items-center gap-2">
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
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">/ page</span>
                            </div>

                            <div className="flex items-center gap-1">
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
                </>
            ) : (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
                    <div className="flex flex-col items-center justify-center opacity-40">
                        {currentTab === 'Active' && <LayoutDashboard className="h-16 w-16 text-slate-300 mb-3" />}
                        {currentTab === 'Done' && <Users className="h-16 w-16 text-slate-300 mb-3" />}
                        {currentTab === 'Overdue' && <Clock className="h-16 w-16 text-slate-300 mb-3" />}
                        {currentTab === 'Trash' && <Trash2 className="h-16 w-16 text-slate-300 mb-3" />}
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                            {loading ? 'Loading...' : `No ${currentTab.toLowerCase()} tasks`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

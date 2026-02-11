'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Briefcase,
    FileText,
    BarChart3,
    Search,
    Filter,
    MoreVertical,
    UserCog,
    Crown,
    Settings2,
    CreditCard,
    Sparkles,
    Download,
    Mail,
    Target,
    RefreshCcw,
    MessageSquare,
    Phone,
    Trash2,
    StickyNote,
    Save,
    ClipboardList,
    Calendar,
    Clock,
    LogOut
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { DeploymentCalendar } from '@/components/admin/deployment-calendar';
import { UserFeatureDialog } from '@/components/admin/user-feature-dialog';
import { AdminNavMenu } from '@/components/admin/admin-nav-menu';
import { TasksTab } from '@/components/admin/tasks-tab';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'user' | 'admin' | 'master';
    is_verified: boolean;
    plan: string;
    feature_access?: {
        cover_letter_enabled: boolean;
        resume_tailor_enabled: boolean;
        custom_resume_enabled: boolean;
    };
    credits?: number;
    created_at: string;
}

interface Stats {
    totalUsers: number;
    totalJobs: number;
    totalTailoredResumes: number;
    totalApplied: number;
    totalVerified: number;
    totalLeads: number;
}

interface AdminStat {
    id: string;
    name: string;
    today: number;
    last24h: number;
    lastWeek: number;
    thisMonth: number;
    total: number;
    clientBreakdown: Array<{ name: string, count: number }>;
    dailyStats: Record<string, number>;
}

interface UserBreakdown {
    id: string;
    name: string;
    appliedCount: number;
}

export default function MasterDashboard() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'leads' | 'tasks' | 'reports' | 'performance' | 'analytics'>('overview');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'performance' || tab === 'analytics' || tab === 'users' || tab === 'overview' || tab === 'leads' || tab === 'tasks' || tab === 'reports') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [performanceData, setPerformanceData] = useState<{
        adminStats: AdminStat[],
        userBreakdown: UserBreakdown[],
        globalDailyStats: Record<string, number>,
        clientDailyStats?: Array<{
            id: string;
            name: string;
            dailyStats: Record<string, number>;
        }>
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportDateRange, setReportDateRange] = useState<{ start: string; end: string }>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteValue, setNoteValue] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const [selectedUserForFeatures, setSelectedUserForFeatures] = useState<Profile | null>(null);
    const [featureDialogOpen, setFeatureDialogOpen] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, statsRes, perfRes, leadsRes] = await Promise.all([
                fetch('/api/admin/users', { cache: 'no-store' }),
                fetch('/api/admin/stats', { cache: 'no-store' }),
                fetch('/api/admin/reports/performance', { cache: 'no-store' }),
                fetch('/api/admin/leads', { cache: 'no-store' })
            ]);

            const usersData = await usersRes.json();
            const statsData = await statsRes.json();
            const perfData = await perfRes.json();
            const leadsData = await leadsRes.json();

            if (usersData.data) setUsers(usersData.data);
            if (statsData.stats) setStats(statsData.stats);
            if (perfData) setPerformanceData(perfData);
            if (leadsData.data) setLeads(leadsData.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCycleRole = async (user: Profile) => {
        const roles: Profile['role'][] = ['user', 'admin', 'master'];
        const currentIndex = roles.indexOf(user.role);
        const nextRole = roles[(currentIndex + 1) % roles.length];

        await handleUpdateUser(user.id, { role: nextRole });
    };

    const handleUpdateUser = async (userId: string, updates: Partial<Profile>) => {
        setUpdatingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) throw new Error('Update failed');

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            toast.success('System permissions updated');
        } catch (error) {
            toast.error('Strategic update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleOpenFeatureDialog = (user: Profile) => {
        setSelectedUserForFeatures(user);
        setFeatureDialogOpen(true);
    };

    const handleFeatureUpdate = (userId: string, updates: Partial<Profile>) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const deleteLead = async (id: string) => {
        if (!confirm('Are you sure you want to purge this intelligence record?')) return;
        try {
            const res = await fetch('/api/admin/leads', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            if (!res.ok) throw new Error('Delete failed');
            setLeads(prev => prev.filter(l => l.id !== id));
            toast.success('Intelligence purged successfully');
        } catch {
            toast.error('Purge failed');
        }
    };

    const deleteSelectedLeads = async () => {
        if (selectedLeads.length === 0) return;
        if (!confirm(`Purge ${selectedLeads.length} selected records?`)) return;

        try {
            const res = await fetch('/api/admin/leads', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedLeads }),
            });
            if (!res.ok) throw new Error('Delete failed');
            setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
            setSelectedLeads([]);
            toast.success('Records purged successfully');
        } catch {
            toast.error('Bulk purge failed');
        }
    };

    const saveNote = async (id: string) => {
        const supabase = createClient();
        // @ts-ignore - leads table notes column exists but types need regeneration
        const { error } = await supabase.from('leads').update({ notes: noteValue }).eq('id', id);

        if (error) {
            toast.error('Strategic note failed to save');
        } else {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: noteValue } : l));
            setEditingNoteId(null);
            toast.success('Note archived');
        }
    };

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectedAdmin = performanceData?.adminStats.find(a => a.id === selectedAdminId);


    return (
        <div className="px-8 py-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 text-shadow-sm">
                            Master Intelligence hub
                        </h1>
                        <p className="text-slate-500 font-medium italic">High-level administrative oversight and strategic gating</p>
                    </div>
                    <AdminNavMenu userRole="master" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-slate-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Gating & Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'leads' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Cold Leads
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'tasks' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'reports' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Reports
                        </button>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>


            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            <StatCard
                                title="Intelligence Units"
                                value={stats?.totalUsers || 0}
                                icon={<Users className="h-6 w-6" />}
                                description="Total profiles registered"
                                color="slate"
                            />
                            <StatCard
                                title="Deployments"
                                value={stats?.totalJobs || 0}
                                icon={<Briefcase className="h-6 w-6" />}
                                description="Active job opportunities"
                                color="blue"
                            />
                            <StatCard
                                title="Tailored Assets"
                                value={stats?.totalTailoredResumes || 0}
                                icon={<FileText className="h-6 w-6" />}
                                description="AI Generated Resumes"
                                color="purple"
                            />
                            <StatCard
                                title="Lead Intel"
                                value={stats?.totalLeads ?? leads.length}
                                icon={<Target className="h-6 w-6" />}
                                description="Acquired via Free Tools"
                                color="rose"
                            />
                            <StatCard
                                title="Verified Gate"
                                value={`${Math.round(((stats?.totalVerified || 0) / (stats?.totalUsers || 1)) * 100)}%`}
                                icon={<ShieldCheck className="h-6 w-6" />}
                                description="Verified access rate"
                                color="emerald"
                            />
                        </div>
                    )}

                    {activeTab === 'leads' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search cold leads..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:italic"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedLeads.length > 0 && (
                                        <button
                                            onClick={deleteSelectedLeads}
                                            className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" /> Purge {selectedLeads.length}
                                        </button>
                                    )}
                                    <button
                                        onClick={fetchData}
                                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100"
                                        title="Refresh Intelligence"
                                    >
                                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase border border-emerald-100 italic">
                                        <Users className="h-3 w-3" />
                                        {leads.length} Cold Leads
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 w-10 border-b border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedLeads.length === leads.length && leads.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedLeads(leads.map(l => l.id));
                                                        else setSelectedLeads([]);
                                                    }}
                                                />
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Identity & Notes</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Current Role</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Contact</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Tool Used</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Acquisition Date</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.filter(l => l.email.toLowerCase().includes(searchQuery.toLowerCase()) || l.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((lead) => (
                                            <tr key={lead.id} className={`group hover:bg-slate-50/70 transition-all border-b border-slate-50 ${selectedLeads.includes(lead.id) ? 'bg-blue-50/30' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300"
                                                        checked={selectedLeads.includes(lead.id)}
                                                        onChange={() => toggleSelectLead(lead.id)}
                                                    />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 font-black text-xs shrink-0">
                                                            {lead.full_name?.[0]?.toUpperCase() || lead.email[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="font-black text-slate-900 leading-tight truncate">{lead.full_name || 'Anonymous'}</p>
                                                                <div className="mt-1 space-y-0.5">
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                                        <span className="text-slate-300">Typed:</span> {lead.email}
                                                                    </p>
                                                                    {lead.extraction_data?.user_email && (
                                                                        <p className={`text-[9px] font-bold uppercase tracking-tight flex items-center gap-1 ${lead.extraction_data.user_email !== lead.email ? 'text-blue-500 italic' : 'text-slate-400'}`}>
                                                                            <span className="text-slate-300">Resume:</span> {lead.extraction_data.user_email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Notes Section */}
                                                            <div className="mt-3 group/note relative">
                                                                {editingNoteId === lead.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none ring-2 ring-slate-100"
                                                                            value={noteValue}
                                                                            onChange={(e) => setNoteValue(e.target.value)}
                                                                            autoFocus
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') saveNote(lead.id);
                                                                                if (e.key === 'Escape') setEditingNoteId(null);
                                                                            }}
                                                                        />
                                                                        <button onClick={() => saveNote(lead.id)} className="p-1.5 bg-slate-900 text-white rounded-lg hover:scale-110 transition-transform">
                                                                            <Save className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => {
                                                                            setEditingNoteId(lead.id);
                                                                            setNoteValue(lead.notes || '');
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-text"
                                                                    >
                                                                        <StickyNote className={`h-3 w-3 ${lead.notes ? 'text-blue-400' : 'text-slate-300'}`} />
                                                                        <p className={`text-[10px] font-medium leading-tight truncate ${lead.notes ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                                                                            {lead.notes || 'Add sticky note...'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold text-slate-600 italic">
                                                        {lead.user_current_title || lead.extraction_data?.user_current_title || 'Undetected'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-slate-300" />
                                                            <span className="text-xs font-bold text-slate-600">
                                                                {lead.user_phone || lead.extraction_data?.user_phone || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 text-slate-300" />
                                                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                                                {lead.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors bg-blue-50 text-blue-700 border-blue-100`}>
                                                        {lead.tool_used}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold text-slate-500">
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </span>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                        {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => toast.info('Intelligence context: ' + JSON.stringify(lead.extraction_data || lead.parsed_data))}
                                                            className="p-2 bg-white border border-slate-100 hover:border-slate-900 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                                            title="View Intelligence"
                                                        >
                                                            <Search className="h-3.5 w-3.5" />
                                                        </button>
                                                        {(lead.user_phone || lead.extraction_data?.user_phone) && (
                                                            <button
                                                                onClick={() => {
                                                                    let phone = (lead.user_phone || lead.extraction_data?.user_phone).replace(/\D/g, '');
                                                                    // Add +1 if not present and length is 10 (standard US)
                                                                    if (phone.length === 10) phone = '1' + phone;
                                                                    window.open(`https://wa.me/${phone}`, '_blank');
                                                                }}
                                                                className="p-2 bg-white border border-emerald-50 hover:border-emerald-400 rounded-xl text-emerald-400 hover:text-emerald-600 transition-all shadow-sm"
                                                                title="WhatsApp Lead"
                                                            >
                                                                <MessageSquare className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteLead(lead.id)}
                                                            className="p-2 bg-white border border-rose-50 hover:border-rose-400 rounded-xl text-rose-300 hover:text-rose-600 transition-all shadow-sm"
                                                            title="Purge Intel"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {leads.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                        <Users className="h-12 w-12 text-slate-300" />
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No cold leads acquired yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200">
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search intelligence index..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:italic"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase border border-amber-100 italic">
                                        <ShieldAlert className="h-3 w-3" />
                                        Manual Gating Required
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Identity</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Clearance Level</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Verified Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Features</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Credits</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 font-black text-xs group-hover:scale-110 transition-transform">
                                                            {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 leading-tight">{user.full_name || 'Anonymous'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${user.role === 'master' ? 'bg-slate-900 text-white border-slate-800' :
                                                        user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-slate-50 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {user.role === 'master' ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${user.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100 anim-pulse'}`}>
                                                        {user.is_verified ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                                                        {user.is_verified ? 'Access Verified' : 'Gated / Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        {user.feature_access?.resume_tailor_enabled && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100" title="Resume Tailor">
                                                                <Sparkles className="h-2.5 w-2.5" />
                                                                RT
                                                            </span>
                                                        )}
                                                        {user.feature_access?.cover_letter_enabled && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100" title="Cover Letter">
                                                                <FileText className="h-2.5 w-2.5" />
                                                                CL
                                                            </span>
                                                        )}
                                                        {user.feature_access?.custom_resume_enabled && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100" title="Custom Resume">
                                                                <FileText className="h-2.5 w-2.5" />
                                                                CR
                                                            </span>
                                                        )}
                                                        {!user.feature_access?.resume_tailor_enabled && !user.feature_access?.cover_letter_enabled && !user.feature_access?.custom_resume_enabled && (
                                                            <span className="text-[10px] text-slate-400 italic">None</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                                                        <span className={`text-sm font-black ${(user.credits ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                            {user.credits ?? 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opactiy-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenFeatureDialog(user)}
                                                            className="p-2.5 bg-white border border-purple-200 hover:border-purple-400 rounded-xl text-purple-400 hover:text-purple-600 transition-all shadow-sm"
                                                            title="Manage Features & Credits"
                                                        >
                                                            <Settings2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCycleRole(user)}
                                                            disabled={updatingId === user.id}
                                                            className="p-2.5 bg-white border border-slate-200 hover:border-slate-900 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                                            title="Cycle Role Level"
                                                        >
                                                            <UserCog className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateUser(user.id, { is_verified: !user.is_verified })}
                                                            disabled={updatingId === user.id}
                                                            className={`p-2.5 bg-white border rounded-xl transition-all shadow-sm ${user.is_verified ? 'border-red-100 text-red-400 hover:text-red-700 hover:border-red-200' : 'border-emerald-100 text-emerald-400 hover:text-emerald-700 hover:border-emerald-200'}`}
                                                            title={user.is_verified ? "Revoke Access" : "Verify Access"}
                                                        >
                                                            {user.is_verified ? <XCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <TasksTab refreshTasks={fetchData} />
                    )}

                    {activeTab === 'reports' && performanceData && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Header + Date Range Picker */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Day-to-Day Progress Reports</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Admin &amp; Client daily application counts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={reportDateRange.start}
                                        onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100"
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">to</span>
                                    <input
                                        type="date"
                                        value={reportDateRange.end}
                                        onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100"
                                    />
                                    <button
                                        onClick={() => {
                                            const end = new Date();
                                            const start = new Date();
                                            start.setDate(start.getDate() - 6);
                                            setReportDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
                                        }}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                                    >
                                        7D
                                    </button>
                                    <button
                                        onClick={() => {
                                            const end = new Date();
                                            const start = new Date();
                                            start.setDate(start.getDate() - 13);
                                            setReportDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
                                        }}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                                    >
                                        14D
                                    </button>
                                    <button
                                        onClick={() => {
                                            const end = new Date();
                                            const start = new Date();
                                            start.setDate(start.getDate() - 29);
                                            setReportDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
                                        }}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                                    >
                                        30D
                                    </button>
                                </div>
                            </div>

                            {/* Admin Daily Output Table */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200">
                                <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight">Admin Daily Output</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Applications per admin per day</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky left-0 bg-slate-50/50 z-10">
                                                    Admin
                                                </th>
                                                {getDateRange(reportDateRange.start, reportDateRange.end).map(date => (
                                                    <th key={date} className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center whitespace-nowrap">
                                                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </th>
                                                ))}
                                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {performanceData.adminStats.map(admin => {
                                                const dates = getDateRange(reportDateRange.start, reportDateRange.end);
                                                const rowTotal = dates.reduce((sum, d) => sum + (admin.dailyStats[d] || 0), 0);
                                                return (
                                                    <tr key={admin.id} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50">
                                                        <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10">
                                                            <p className="font-black text-slate-900 text-sm whitespace-nowrap">{admin.name}</p>
                                                        </td>
                                                        {dates.map(date => {
                                                            const count = admin.dailyStats[date] || 0;
                                                            return (
                                                                <td key={date} className="px-3 py-4 text-center">
                                                                    {count > 0 ? (
                                                                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                                            {count}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-200">-</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                                {rowTotal}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Totals row */}
                                            <tr className="bg-slate-50/80 border-t-2 border-slate-200">
                                                <td className="px-6 py-4 sticky left-0 bg-slate-50/80 z-10">
                                                    <p className="font-black text-slate-600 text-[10px] uppercase tracking-widest">Daily Total</p>
                                                </td>
                                                {getDateRange(reportDateRange.start, reportDateRange.end).map(date => {
                                                    const dayTotal = performanceData.adminStats.reduce((sum, a) => sum + (a.dailyStats[date] || 0), 0);
                                                    return (
                                                        <td key={date} className="px-3 py-4 text-center">
                                                            <span className="text-xs font-black text-slate-700">{dayTotal || '-'}</span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                                        {performanceData.adminStats.reduce((sum, a) => {
                                                            return sum + getDateRange(reportDateRange.start, reportDateRange.end).reduce((s, d) => s + (a.dailyStats[d] || 0), 0);
                                                        }, 0)}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Client Daily Progress Table */}
                            {performanceData.clientDailyStats && performanceData.clientDailyStats.length > 0 && (
                                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200">
                                    <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 tracking-tight">Client Daily Progress</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Applications per client per day</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky left-0 bg-slate-50/50 z-10">
                                                        Client
                                                    </th>
                                                    {getDateRange(reportDateRange.start, reportDateRange.end).map(date => (
                                                        <th key={date} className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center whitespace-nowrap">
                                                            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </th>
                                                    ))}
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {performanceData.clientDailyStats.map(client => {
                                                    const dates = getDateRange(reportDateRange.start, reportDateRange.end);
                                                    const rowTotal = dates.reduce((sum, d) => sum + (client.dailyStats[d] || 0), 0);
                                                    if (rowTotal === 0) return null;
                                                    return (
                                                        <tr key={client.id} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50">
                                                            <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-100 flex-shrink-0">
                                                                        {client.name[0]?.toUpperCase() || '?'}
                                                                    </div>
                                                                    <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{client.name}</p>
                                                                </div>
                                                            </td>
                                                            {dates.map(date => {
                                                                const count = client.dailyStats[date] || 0;
                                                                return (
                                                                    <td key={date} className="px-3 py-4 text-center">
                                                                        {count > 0 ? (
                                                                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                                                                {count}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-slate-200">-</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-4 py-4 text-right">
                                                                <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                                    {rowTotal}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Global Deployment Calendar */}
                            <DeploymentCalendar
                                dailyStats={performanceData.globalDailyStats || {}}
                                title="Global Daily Throughput"
                            />
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Admin Performance Table */}
                                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200">
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Admin Operation Report</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live Strategic Output</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={fetchData}
                                            className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm flex items-center gap-2"
                                        >
                                            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Sync Data</span>
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Administrator</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Today (Since 00:00)</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Rolling 24H</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">Last Week</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">This Month</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Lifetime</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {performanceData?.adminStats.map(admin => (
                                                    <tr
                                                        key={admin.id}
                                                        onClick={() => setSelectedAdminId(admin.id)}
                                                        className={`group cursor-pointer transition-all border-b border-slate-50 ${selectedAdminId === admin.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}`}
                                                    >
                                                        <td className="px-8 py-6">
                                                            <p className={`font-black tracking-tight ${selectedAdminId === admin.id ? 'text-blue-700' : 'text-slate-900'}`}>{admin.name}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+{admin.today}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{admin.last24h}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{admin.lastWeek}</td>
                                                        <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{admin.thisMonth}</td>
                                                        <td className="px-8 py-6 text-right text-sm font-black text-slate-900">{admin.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Dynamic Admin Drill-Down Breakdown */}
                                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-slate-200 flex flex-col">
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                                    {selectedAdmin ? selectedAdmin.name : 'Select Administrator'}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                    {selectedAdmin ? 'Client Breakdown' : 'Click a row to drill down'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                                        {!selectedAdmin ? (
                                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
                                                <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an administrator<br />from the table</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {/* Quick stats */}
                                                <div className="grid grid-cols-3 border-b border-slate-100">
                                                    <div className="p-4 text-center border-r border-slate-100">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                                                        <p className="text-2xl font-black text-emerald-600 tracking-tighter mt-1">{selectedAdmin.today}</p>
                                                    </div>
                                                    <div className="p-4 text-center border-r border-slate-100">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Week</p>
                                                        <p className="text-2xl font-black text-blue-600 tracking-tighter mt-1">{selectedAdmin.lastWeek}</p>
                                                    </div>
                                                    <div className="p-4 text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                                        <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{selectedAdmin.total}</p>
                                                    </div>
                                                </div>

                                                {/* Client table */}
                                                {selectedAdmin.clientBreakdown.length > 0 ? (
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50/50">
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Client</th>
                                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Applied</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedAdmin.clientBreakdown.map((client: any, idx: number) => (
                                                                <tr key={idx} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-100 flex-shrink-0">
                                                                                {client.name[0]?.toUpperCase() || '?'}
                                                                            </div>
                                                                            <p className="font-bold text-slate-900 text-sm truncate">{client.name}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">{client.count}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="p-8 text-center">
                                                        <p className="text-xs text-slate-400 italic">No applications attributed yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Per-Admin Deployment Calendar — full width below the grid */}
                            {selectedAdmin && (
                                <DeploymentCalendar dailyStats={selectedAdmin.dailyStats} title={`${selectedAdmin.name}'s Deployment Heatmap`} />
                            )}

                            {/* Global User Reach */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-slate-200">
                                <div className="p-8 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Global Client Reach</h3>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Client Profile</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Total Strategized Applications</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {performanceData?.userBreakdown.map(user => (
                                                <tr key={user.id} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50">
                                                    <td className="px-8 py-5 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-100">
                                                            {user.name[0].toUpperCase()}
                                                        </div>
                                                        <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className="text-xs font-black text-slate-900">{user.appliedCount}</span>
                                                            <div className="h-1.5 w-32 bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                                                    style={{ width: `${Math.min((user.appliedCount / 50) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm border-b-8 border-b-slate-200">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">System Performance Metrics</h3>
                                    </div>

                                    <div className="space-y-8">
                                        <ReportBar label="Job Import Engine" value={94} color="slate" />
                                        <ReportBar label="AI Tailoring Accuracy" value={88} color="blue" />
                                        <ReportBar label="Application Throughput" value={100} color="purple" />
                                        <ReportBar label="Global Verification Rate" value={stats ? Math.round((stats.totalVerified / stats.totalUsers) * 100) : 0} color="emerald" />
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm border-b-8 border-b-slate-200 flex flex-col">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Clearance Distribution</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 flex-1">
                                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner flex flex-col justify-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Masters</p>
                                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{users.filter(u => u.role === 'master').length}</p>
                                        </div>
                                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner flex flex-col justify-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Verified Admins</p>
                                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{users.filter(u => u.role === 'admin').length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DeploymentCalendar
                                dailyStats={performanceData?.globalDailyStats || {}}
                                title="Global Operational Throughput"
                            />
                        </div>
                    )}
                </>
            )}

            {/* User Feature Dialog */}
            <UserFeatureDialog
                user={selectedUserForFeatures}
                open={featureDialogOpen}
                onOpenChange={setFeatureDialogOpen}
                onUpdate={handleFeatureUpdate}
            />
        </div>
    );
}

function StatCard({ title, value, icon, description, color }: any) {
    const colorMap: any = {
        slate: 'bg-slate-900 text-slate-900 border-slate-100',
        blue: 'bg-blue-600 text-blue-600 border-blue-100',
        purple: 'bg-purple-600 text-purple-600 border-purple-100',
        emerald: 'bg-emerald-600 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-600 text-rose-600 border-rose-100',
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden border-b-4 border-b-slate-200">
            <div className={`p-4 rounded-2xl bg-opacity-5 mb-8 inline-flex ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
                {icon}
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">{title}</h3>
            <div className="flex items-end justify-between">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">{description}</p>
            <div className={`absolute top-0 right-0 h-1 w-full bg-opacity-20 ${colorMap[color].split(' ')[0]}`}></div>
        </div>
    );
}

function getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function ReportBar({ label, value, color }: any) {
    const colorMap: any = {
        slate: 'bg-slate-900',
        blue: 'bg-blue-600',
        purple: 'bg-purple-600',
        emerald: 'bg-emerald-600',
        rose: 'bg-rose-600',
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                <span>{label}</span>
                <span>{value}% Effective</span>
            </div>
            <div className="h-4 w-full bg-slate-50 rounded-lg overflow-hidden p-1 border border-slate-100 shadow-inner">
                <div
                    className={`h-full rounded-md transition-all duration-1000 ${colorMap[color]}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

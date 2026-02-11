import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Auth check using the user's session
        const authSupabase = await createServerClient();
        const { data: { user } } = await authSupabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await authSupabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .single();

        const role = (profile as any)?.role;
        if (role !== 'master' && role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Data aggregation using Service Role to bypass RLS
        const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last24hDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch all strategic units and deployments
        const { data: admins } = await (serviceSupabase
            .from('profiles') as any)
            .select('id, full_name, email')
            .in('role', ['admin', 'master']);

        const { data: clients } = await (serviceSupabase
            .from('profiles') as any)
            .select('id, full_name, email')
            .eq('role', 'user');

        // Fetch applied jobs — use both applied_by and assigned_to to attribute work.
        // applied_by is set when admin marks a job as Applied; assigned_to is set when admin claims it.
        const { data: allAppliedJobs } = await (serviceSupabase
            .from('jobs') as any)
            .select('id, user_id, applied_by, assigned_to, applied_at')
            .eq('status', 'applied')
            .gte('applied_at', ninetyDaysAgo);

        const clientsMap = new Map<string, string>(clients?.map((c: any) => [c.id, c.full_name || c.email]) || []);
        // Filter to jobs that have an admin attribution (either applied_by or assigned_to)
        const jobs = (allAppliedJobs || []).filter((j: any) => j.applied_by || j.assigned_to);

        // Calculate Global Daily Stats for Calendar
        const globalDailyStats: Record<string, number> = {};
        jobs.forEach((j: any) => {
            if (j.applied_at) {
                const dateKey = new Date(j.applied_at).toISOString().split('T')[0];
                globalDailyStats[dateKey] = (globalDailyStats[dateKey] || 0) + 1;
            }
        });

        const adminStats = (admins || []).map((admin: any) => {
            // Attribute job to the admin who applied it; fall back to whoever was assigned
            const adminJobs = jobs.filter((j: any) => (j.applied_by || j.assigned_to) === admin.id);

            // Per-client breakdown for this admin
            const clientCounts: Record<string, { name: string, count: number }> = {};
            // Daily breakdown for this specific admin
            const dailyCounts: Record<string, number> = {};

            adminJobs.forEach((j: any) => {
                const clientId = j.user_id;
                const clientName = clientsMap.get(clientId) || 'Unknown Client';
                if (!clientCounts[clientId]) {
                    clientCounts[clientId] = { name: clientName, count: 0 };
                }
                clientCounts[clientId].count++;

                if (j.applied_at) {
                    const dateKey = new Date(j.applied_at).toISOString().split('T')[0];
                    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
                }
            });

            return {
                id: admin.id,
                name: admin.full_name || admin.email,
                today: adminJobs.filter((j: any) => j.applied_at && new Date(j.applied_at).toDateString() === now.toDateString()).length,
                last24h: adminJobs.filter((j: any) => j.applied_at && new Date(j.applied_at) >= last24hDate).length,
                lastWeek: adminJobs.filter((j: any) => j.applied_at && new Date(j.applied_at) >= lastWeekDate).length,
                thisMonth: adminJobs.filter((j: any) => j.applied_at && new Date(j.applied_at) >= thisMonthDate).length,
                total: adminJobs.length,
                clientBreakdown: Object.values(clientCounts).sort((a: any, b: any) => b.count - a.count),
                dailyStats: dailyCounts
            };
        });

        // 2. Global Intelligence Unit (User) Breakdown
        const userBreakdown = (clients || []).map((client: any) => {
            const count = jobs.filter((j: any) => j.user_id === client.id).length;
            return {
                id: client.id,
                name: client.full_name || client.email,
                appliedCount: count
            };
        }).sort((a: any, b: any) => b.appliedCount - a.appliedCount);

        // 3. Client Daily Stats — per-client daily application counts
        const clientDailyStats = (clients || []).map((client: any) => {
            const clientJobs = jobs.filter((j: any) => j.user_id === client.id);
            const dailyCounts: Record<string, number> = {};
            clientJobs.forEach((j: any) => {
                if (j.applied_at) {
                    const dateKey = new Date(j.applied_at).toISOString().split('T')[0];
                    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
                }
            });
            return {
                id: client.id,
                name: client.full_name || client.email,
                dailyStats: dailyCounts,
            };
        }).filter((c: any) => Object.keys(c.dailyStats).length > 0)
          .sort((a: any, b: any) => {
            const totalA = Object.values(a.dailyStats).reduce((s: number, n: any) => s + n, 0);
            const totalB = Object.values(b.dailyStats).reduce((s: number, n: any) => s + n, 0);
            return (totalB as number) - (totalA as number);
          });

        return NextResponse.json({ adminStats, userBreakdown, globalDailyStats, clientDailyStats });
    } catch (error) {
        console.error('Strategic Performance Report Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

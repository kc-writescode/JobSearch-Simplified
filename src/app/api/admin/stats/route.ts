import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if requester is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if ((profile as any)?.role !== 'master') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Analytics: Total Users, Total Jobs, Total Tailored Resumes, Total Applied
        const [usersCount, jobsCount, tailoredCount, appliedCount, verifiedCount] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('jobs').select('*', { count: 'exact', head: true }),
            supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }),
            supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        ]);

        // Role Distribution
        const { data: roleData } = await supabase
            .from('profiles')
            .select('role');

        const roles = {
            master: (roleData as any[])?.filter(r => r.role === 'master').length || 0,
            admin: (roleData as any[])?.filter(r => r.role === 'admin').length || 0,
            user: (roleData as any[])?.filter(r => r.role === 'user').length || 0,
        };

        return NextResponse.json({
            stats: {
                totalUsers: usersCount.count || 0,
                totalJobs: jobsCount.count || 0,
                totalTailoredResumes: tailoredCount.count || 0,
                totalApplied: appliedCount.count || 0,
                totalVerified: verifiedCount.count || 0,
            },
            roles
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

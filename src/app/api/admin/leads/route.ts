import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin or master
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch leads
        const { data: leads, error: leadsError } = await (supabase
            .from('leads') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        return NextResponse.json({ data: leads });

    } catch (error: any) {
        console.error('Admin Leads API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

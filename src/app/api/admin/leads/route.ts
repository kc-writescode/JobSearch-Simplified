import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

export async function DELETE(request: NextRequest) {
    try {
        // Auth check
        const authSupabase = await createClient();
        const { data: { user }, error: authError } = await authSupabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await (authSupabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
        }

        // Use service role to bypass RLS (no DELETE policy on leads table)
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase.from('leads').delete().in('id', ids);
        if (error) throw error;

        return NextResponse.json({ deleted: ids.length }, { status: 200 });
    } catch (error: any) {
        console.error('Admin Leads DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

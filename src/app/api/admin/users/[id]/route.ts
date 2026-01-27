import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { role, is_verified } = body;

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

        // Update user
        const updateData: any = {};
        if (role !== undefined) updateData.role = role;
        if (is_verified !== undefined) updateData.is_verified = is_verified;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await (supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single() as any);

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

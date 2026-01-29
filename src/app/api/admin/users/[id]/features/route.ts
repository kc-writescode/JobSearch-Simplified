import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { feature_access, credits } = body;

        const supabase = await createClient();

        // Check if requester is master
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if ((profile as any)?.role !== 'master') {
            return NextResponse.json({ error: 'Forbidden - Master access required' }, { status: 403 });
        }

        // Build update data
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (feature_access !== undefined) {
            updateData.feature_access = feature_access;
        }

        if (credits !== undefined) {
            updateData.credits = credits;
        }

        // Update user profile
        const { data, error } = await (supabase
            .from('profiles') as any)
            .update(updateData)
            .eq('id', id)
            .select('id, email, full_name, role, is_verified, plan, feature_access, credits')
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error updating user features:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET endpoint to fetch user's feature access (for use by other parts of the app)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabase = await createClient();

        // Check if requester is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Users can only fetch their own feature access, or admins/masters can fetch anyone's
        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isMasterOrAdmin = ['master', 'admin'].includes((requesterProfile as any)?.role);

        if (user.id !== id && !isMasterOrAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, feature_access, credits')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error fetching user features:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { full_name, linkedin_url, github_url, portfolio_url, phone } = body;

        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
        if (github_url !== undefined) updateData.github_url = github_url;
        if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url;
        if (phone !== undefined) updateData.phone = phone;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await (supabase
            .from('profiles') as any)
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

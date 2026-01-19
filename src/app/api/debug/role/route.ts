import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({
      error: 'Not authenticated',
      authError: authError?.message
    }, { status: 401 });
  }

  const { data: profile, error: profileError } = await (supabase
    .from('profiles') as any)
    .select('id, email, role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({
      error: 'Profile not found',
      profileError: profileError.message,
      userId: user.id,
      userEmail: user.email
    }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email
    },
    profile: profile,
    message: profile?.role === 'admin' ? 'You are an admin!' : 'You are a regular user'
  });
}

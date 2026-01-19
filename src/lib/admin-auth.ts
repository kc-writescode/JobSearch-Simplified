import { createClient } from '@/lib/supabase/server';

export async function verifyAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false, error: 'Unauthorized' };
  }

  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single();

  if ((profile as { role?: string })?.role !== 'admin') {
    return { user, isAdmin: false, error: 'Forbidden - Admin access required' };
  }

  return { user, isAdmin: true, error: null };
}

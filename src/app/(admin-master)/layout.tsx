import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Lock } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch full profile to check role and verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single();

  const role = (profile as any)?.role;
  const isVerified = (profile as any)?.is_verified;

  // Level 1 Security: Must be Admin or Master
  if (role !== 'admin' && role !== 'master') {
    redirect('/dashboard');
  }

  // Level 2 Security: Must be verified by Master to access the hub
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Verification Pending</h1>
          <p className="text-slate-500 font-medium leading-relaxed italic">
            Your administrative credentials have been recorded. Access to the Intelligence Hub is currently locked until verified by the System Master.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-100 italic tracking-widest">
              Access Restricted
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="w-full text-xs font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest">
                Sign Out of Account
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell userRole={role}>
      {children}
    </AdminShell>
  );
}

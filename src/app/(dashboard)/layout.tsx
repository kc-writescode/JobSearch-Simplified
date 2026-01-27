import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { VerificationForm } from '@/components/verification-form';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_verified, full_name, linkedin_url, github_url')
    .eq('id', user.id)
    .single();

  const isVerified = (profile as any)?.is_verified;

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center" suppressHydrationWarning>
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in duration-500 border-b-8 border-b-blue-600">
          <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-8 shadow-inner border border-blue-100">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3 italic uppercase">Platform Ingress</h1>
          <p className="text-slate-500 font-medium leading-relaxed italic text-sm">
            Your intelligence node is active. To gain strategic access to the dashboard, please finalize your identity for review by a System Master.
          </p>

          <VerificationForm initialData={{
            full_name: (profile as any)?.full_name || '',
            linkedin_url: (profile as any)?.linkedin_url || '',
            github_url: (profile as any)?.github_url || '',
          }} />

          <div className="mt-8 pt-8 border-t border-slate-100 italic">
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest">
                Sign Out / Exit Terminal
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" suppressHydrationWarning>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  user: User;
  profile: { full_name: string | null } | null;
}

// Simplified navigation - only 2 main items
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl lg:flex lg:flex-col sticky top-0 h-screen shadow-[1px_0_0_0_rgba(0,0,0,0.05)]" suppressHydrationWarning>
      {/* Brand Header */}
      <div className="flex h-24 items-center px-8 border-b border-slate-100">
        <Logo />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Terminal</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[13px] font-bold tracking-tight transition-all duration-300',
                isActive
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02] border border-blue-500'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:px-5'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'
                )}
              />
              {item.name}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-white rounded-full ml-1"></div>
              )}
            </Link>
          );
        })}

        <div className="pt-8">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Support & Config</p>
          <Link
            href="/settings"
            className={cn(
              'group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[13px] font-bold tracking-tight transition-all duration-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:px-5'
            )}
          >
            <Settings className="h-5 w-5 text-slate-400 group-hover:text-amber-500 group-hover:rotate-45 transition-transform" />
            System Preferences
          </Link>
        </div>
      </nav>

      {/* Analytics Summary */}
      <div className="px-6 py-8">
        <div className="rounded-[2rem] bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-colors"></div>
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Pipeline Status</p>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <p className="text-xl font-black text-white leading-none">12</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Active</p>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <p className="text-xl font-black text-white leading-none">84%</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Success</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Nexus */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 group/user">
          <div className="relative">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-500/20 group-hover/user:scale-105 transition-transform">
              {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-[13px] font-black text-slate-900 tracking-tight leading-none mb-1">
              {profile?.full_name?.split(' ')[0] || 'Member'}
            </p>
            <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Standard Node
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="group/logout p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
            title="Disconnect Terminal"
          >
            <LogOut className="h-5 w-5 transition-transform group-hover/logout:-translate-x-0.5" />
          </button>
        </div>
        <div className="mt-4 text-[9px] font-bold text-slate-300 text-center uppercase tracking-widest">
          Developed by KC-codes
        </div>
      </div>
    </aside>
  );
}

// Icons
function LayoutDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

function LogOut({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

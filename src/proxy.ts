import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Helper function to get user role
  async function getUserRole(userId: string): Promise<string | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Proxy] Error fetching profile:', error.message);
      return null;
    }

    console.log('[Proxy] User role:', profile?.role, 'for path:', path);
    return profile?.role ?? null;
  }

  // 1. Admin Routes Protection
  if (path.startsWith('/admin') || path.startsWith('/master')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', path);
      return NextResponse.redirect(url);
    }

    const role = await getUserRole(user.id);
    if (role !== 'admin' && role !== 'master') {
      console.log('[Proxy] Non-privileged user trying to access admin/master route, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. User Dashboard Protection (and other protected paths)
  const userProtectedPaths = ['/dashboard', '/resume', '/jobs', '/applications', '/settings'];
  const isUserProtectedItem = userProtectedPaths.some(p => path.startsWith(p));

  if (isUserProtectedItem) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', path);
      return NextResponse.redirect(url);
    }

    const role = await getUserRole(user.id);
    if (role === 'admin' || role === 'master') {
      const target = role === 'master' ? '/master' : '/admin/tasks';
      console.log(`[Proxy] privileged user acting as ${role} accessing user route, redirecting to ${target}`);
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // 3. Auth Page Redirection (redirect logged-in users away from login/signup)
  const authPaths = ['/login', '/signup', '/forgot-password'];
  if (authPaths.includes(path)) {
    if (user) {
      const role = await getUserRole(user.id);
      if (role === 'admin' || role === 'master') {
        const target = role === 'master' ? '/master' : '/admin/tasks';
        console.log(`[Proxy] privileged user acting as ${role} on auth page, redirecting to ${target}`);
        return NextResponse.redirect(new URL(target, request.url));
      } else {
        console.log('[Proxy] User on auth page, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};

// middleware.js
// Route protection with strict role enforcement:
//  - /patron/**      requires a logged-in Club Patron (club_patron role) — non-patron roles are redirected to their own dashboard
//  - /approvals/**   requires the specific approver role matching the route segment (sm1→/approvals/sm1, etc.)
//  - /admin/**       requires the admin role
// Also refreshes the Supabase auth cookie on every request so sessions don't silently expire.

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Returns the canonical landing dashboard for a given role. */
function getDashboard(role) {
  switch (role) {
    case 'club_patron':  return '/patron/dashboard';
    case 'admin':        return '/admin';
    case 'sm1':          return '/approvals/sm1';
    case 'sm2':          return '/approvals/sm2';
    case 'sm3':          return '/approvals/sm3';
    case 'sm4':          return '/approvals/sm4';
    case 'welfare_head': return '/approvals/welfare';
    default:             return '/';
  }
}

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the session — keeps auth cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Public routes ─────────────────────────────────────────────────────────
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/patron/login') ||
    pathname.startsWith('/patron/signup') ||
    pathname.startsWith('/patron/forgot-password') ||
    pathname.startsWith('/patron/reset-password');

  if (isPublic) {
    // If already logged in, bounce away from login/signup to their proper dashboard
    if (
      user &&
      (pathname.startsWith('/patron/login') || pathname.startsWith('/patron/signup'))
    ) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return NextResponse.redirect(
        new URL(getDashboard(profile?.role), request.url)
      );
    }

    return response;
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/patron/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // ── Fetch role for all protected routes ───────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // ── Admin pages ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getDashboard(role), request.url));
  }

  // ── Patron pages (strict: only club_patron may enter /patron/*) ───────────
  if (
    pathname.startsWith('/patron') &&
    !isPublic &&
    role !== 'club_patron'
  ) {
    // Approvers and admins visiting /patron/* get sent to their own dashboard
    return NextResponse.redirect(new URL(getDashboard(role), request.url));
  }

  // ── Approval pages (each approver may only visit their own segment) ────────
  if (pathname.startsWith('/approvals')) {
    const allowed = {
      sm1:          '/approvals/sm1',
      sm2:          '/approvals/sm2',
      sm3:          '/approvals/sm3',
      sm4:          '/approvals/sm4',
      welfare_head: '/approvals/welfare',
    };

    // /approvals/review/* is accessible by any approver role or admin (read-only)
    if (pathname.startsWith('/approvals/review')) {
      const approverRoles = ['sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin'];
      if (!approverRoles.includes(role)) {
        return NextResponse.redirect(new URL(getDashboard(role), request.url));
      }
      return response;
    }

    // For all other /approvals/* paths, enforce the role→path mapping
    if (!pathname.startsWith(allowed[role] ?? '')) {
      return NextResponse.redirect(new URL(getDashboard(role), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except Next.js internals and static files.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
// middleware.js
// Route protection:
//  - /patron/**      requires a logged-in Club Patron session (Teachers never hit this — they use /teacher-booking, no auth)
//  - /approvals/**    requires an approver role (Senior Master 1-4, Head of Student Welfare)
//  - /admin/**        requires the admin role
// Also refreshes the Supabase auth cookie on every request so sessions don't silently expire.

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const APPROVER_ROLES = ['sm1', 'sm2', 'sm3', 'sm4', 'welfare_head'];

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isPatronRoute = path.startsWith('/patron') && !path.startsWith('/patron/signup') && !path.startsWith('/patron/login');
  const isApprovalRoute = path.startsWith('/approvals');
  const isAdminRoute = path.startsWith('/admin');

  if ((isPatronRoute || isApprovalRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL('/patron/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Role checks for approval and admin routes rely on a `role` column in the `users` table.
  if ((isApprovalRoute || isAdminRoute) && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/patron/dashboard', request.url));
    }

    if (isApprovalRoute && !APPROVER_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/patron/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/patron/:path*', '/approvals/:path*', '/admin/:path*'],
};
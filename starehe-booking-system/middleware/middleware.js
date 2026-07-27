import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getDashboard(role) {
  switch (role) {
    case 'club_patron':
      return '/patron/dashboard';
    case 'admin':
      return '/admin';
    case 'sm1':
      return '/approvals/sm1';
    case 'sm2':
      return '/approvals/sm2';
    case 'sm3':
      return '/approvals/sm3';
    case 'sm4':
      return '/approvals/sm4';
    case 'welfare_head':
      return '/approvals/welfare';
    default:
      return '/';
  }
}

export async function middleware(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request,
          });

          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          response = NextResponse.next({
            request,
          });

          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session and get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/patron/login') ||
    pathname.startsWith('/patron/signup') ||
    pathname.startsWith('/patron/forgot-password');

  // Allow public routes
  if (isPublic) {
    // Already logged in? Send them to their dashboard.
    if (
      user &&
      (pathname.startsWith('/patron/login') ||
        pathname.startsWith('/patron/signup'))
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

  // Not logged in
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/patron/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // Get user role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // Admin pages
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(
      new URL(getDashboard(role), request.url)
    );
  }

  // Patron pages
  if (pathname.startsWith('/patron') && role !== 'club_patron') {
    return NextResponse.redirect(
      new URL(getDashboard(role), request.url)
    );
  }

  // Approval pages
  if (pathname.startsWith('/approvals')) {
    const allowed = {
      sm1: '/approvals/sm1',
      sm2: '/approvals/sm2',
      sm3: '/approvals/sm3',
      sm4: '/approvals/sm4',
      welfare_head: '/approvals/welfare',
    };

    if (!pathname.startsWith(allowed[role] || '')) {
      return NextResponse.redirect(
        new URL(getDashboard(role), request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run the middleware on all routes except:
     * - static files
     * - images
     * - favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
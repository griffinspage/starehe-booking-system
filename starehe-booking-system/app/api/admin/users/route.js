// app/api/admin/users/route.js
// GET  — list every user with their role (admin only)
// POST — create a brand-new user (e.g. a Senior Master or the Welfare Head)
//        directly via Supabase Auth admin API, with the role already set —
//        this is what removes the need to touch the Supabase table editor.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = ['club_patron', 'sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin'];

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401 };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.', status: 403 };

  return { user };
}

export async function GET() {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data || [] });
}

export async function POST(request) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json();
  const { email, password, fullName, role } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'email, password, and role are required.' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Create the actual auth account (pre-confirmed, so they can log in right away
  //    without waiting on a confirmation email — appropriate for staff accounts an
  //    admin is setting up on someone else's behalf).
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const newUserId = authData.user.id;

  // 2. Create the profile row with the role already set
  const { data: profile, error: profileError } = await admin
    .from('users')
    .insert({
      id: newUserId,
      email,
      full_name: fullName || email,
      role,
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned account with no profile
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ user: profile }, { status: 201 });
}
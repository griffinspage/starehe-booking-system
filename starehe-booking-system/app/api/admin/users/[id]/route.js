// app/api/admin/users/[id]/route.js
// PATCH  — change a user's role (this is the actual "assign SM1/SM2/.../admin" action)
// DELETE — remove a user entirely (auth account + profile row)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = ['club_patron', 'sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin'];

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401, currentUserId: null };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.', status: 403, currentUserId: user.id };

  return { user, currentUserId: user.id };
}

export async function PATCH(request, { params }) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { role, fullName } = await request.json();

  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  // Prevent an admin from accidentally demoting themselves and losing access
  if (params.id === check.currentUserId && role && role !== 'admin') {
    return NextResponse.json({ error: 'You cannot change your own admin role.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates = {};
  if (role) updates.role = role;
  if (fullName) updates.full_name = fullName;

  const { data, error } = await admin.from('users').update(updates).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data });
}

export async function DELETE(request, { params }) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  if (params.id === check.currentUserId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: profileError } = await admin.from('users').delete().eq('id', params.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  await admin.auth.admin.deleteUser(params.id);

  return NextResponse.json({ status: 'deleted' });
}
// app/api/admin/resources/[id]/route.js
// PATCH  — update a resource (status, location, identifier, condition)
// DELETE — remove a resource entirely

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401 };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.', status: 403 };

  return { user };
}

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const updates = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin.from('resources').update(updates).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resource: data });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const admin = createAdminClient();
  const { error } = await admin.from('resources').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: 'deleted' });
}
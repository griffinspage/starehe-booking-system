// app/api/admin/logs/route.js
// GET ?resourceType=&action= — the inventory audit trail: every issue,
// return, and maintenance event, joined with the resource identifier and
// the staff member who performed the action.

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

export async function GET(request) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const action = request.nextUrl.searchParams.get('action');

  const admin = createAdminClient();

  let query = admin
    .from('inventory_logs')
    .select('*, resources(identifier, resource_type), users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (action && action !== 'all') query = query.eq('action', action);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data || [] });
}
// app/api/admin/returns/route.js
// GET   — lists resources currently flagged 'maintenance' (i.e. returned in
//         bad condition and awaiting admin clearance) plus their return record.
// PATCH — clears a resource from maintenance back to 'available'.

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

export async function GET() {
  const supabase = await createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const admin = createAdminClient();

  const { data: resources, error } = await admin
    .from('resources')
    .select('*')
    .eq('status', 'maintenance')
    .order('returned_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resourceIds = (resources || []).map((r) => r.id);
  let returns = [];
  if (resourceIds.length > 0) {
    const { data } = await admin
      .from('returns')
      .select('*')
      .in('resource_id', resourceIds)
      .order('created_at', { ascending: false });
    returns = data || [];
  }

  const withReturns = (resources || []).map((r) => ({
    ...r,
    latestReturn: returns.find((ret) => ret.resource_id === r.id) || null,
  }));

  return NextResponse.json({ resources: withReturns });
}

export async function PATCH(request) {
  const supabase = await createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { resourceId } = await request.json();
  if (!resourceId) return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from('resources')
    .update({ status: 'available', condition: 'good' })
    .eq('id', resourceId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await admin.from('inventory_logs').insert({
    resource_id: resourceId,
    action: 'maintenance_cleared',
    actor_id: check.user.id,
    notes: 'Cleared by admin — resource returned to availability.',
  });

  return NextResponse.json({ status: 'ok' });
}
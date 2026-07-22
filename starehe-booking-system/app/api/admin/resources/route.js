// app/api/admin/resources/route.js
// GET  — list every resource (admin only)
// POST — create a new resource (projector / bus / computer lab)

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
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('resource_type', { ascending: true })
    .order('identifier', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resources: data || [] });
}

export async function POST(request) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json();
  const { resourceType, identifier, location } = body;

  if (!resourceType || !identifier) {
    return NextResponse.json({ error: 'resourceType and identifier are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('resources')
    .insert({ resource_type: resourceType, identifier, location: location || null, status: 'available' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resource: data }, { status: 201 });
}
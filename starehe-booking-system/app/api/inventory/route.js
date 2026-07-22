// app/api/inventory/route.js
// GET — returns every resource grouped by type, for the patron-facing
// availability view (projectors / buses / computer labs and their status).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('resource_type', { ascending: true })
    .order('identifier', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resources: data || [] });
}
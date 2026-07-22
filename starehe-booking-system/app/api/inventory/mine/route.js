// app/api/inventory/mine/route.js
// GET — bookings belonging to the logged-in patron where a resource is
// currently held (approved + not yet returned). This is what the
// "Return Resource" list on the Inventory page is built from.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('bookings')
    .select('*, resources(*)')
    .eq('club_patron_id', user.id)
    .eq('status', 'approved')
    .eq('return_status', 'not_returned')
    .not('resource_id', 'is', null)
    .order('booking_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ heldBookings: data || [] });
}
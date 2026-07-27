// app/api/admin/clubs/route.js
// GET — list every club (from club_patrons, joined with their user profile)
// along with a booking count, for the admin's club overview.

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

// Get every club patron
const { data: patrons, error } = await admin
  .from('users')
  .select(`
    id,
    club_name,
    full_name,
    email
  `)
  .eq('role', 'club_patron')
  .order('club_name', { ascending: true });

if (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}

// Get phone numbers (optional)
const { data: patronInfo } = await admin
  .from('club_patrons')
  .select('id, phone_number');

// Get bookings
const { data: bookings } = await admin
  .from('bookings')
  .select('club_patron_id,status');

const clubs = (patrons || []).map((p) => {
  const info = patronInfo?.find((x) => x.id === p.id);

  const clubBookings = (bookings || []).filter(
    (b) => b.club_patron_id === p.id
  );

  return {
    id: p.id,
    clubName: p.club_name,
    patronName: p.full_name,
    phoneNumber: info?.phone_number || '',
    email: p.email,
    totalBookings: clubBookings.length,
    approvedBookings: clubBookings.filter(
      (b) => b.status === 'approved'
    ).length,
    pendingBookings: clubBookings.filter(
      (b) => b.status === 'pending'
    ).length,
  };
});

return NextResponse.json({ clubs });}
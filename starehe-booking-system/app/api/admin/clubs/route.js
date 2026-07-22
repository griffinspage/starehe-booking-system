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
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const admin = createAdminClient();

  const { data: patrons, error } = await admin
    .from('club_patrons')
    .select('*, users(email, created_at)')
    .order('club_name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: bookings } = await admin.from('bookings').select('club_patron_id, status');

  const clubs = (patrons || []).map((p) => {
    const clubBookings = (bookings || []).filter((b) => b.club_patron_id === p.id);
    return {
      id: p.id,
      clubName: p.club_name,
      patronName: p.patron_name,
      phoneNumber: p.phone_number,
      email: p.users?.email,
      joinedAt: p.users?.created_at,
      totalBookings: clubBookings.length,
      approvedBookings: clubBookings.filter((b) => b.status === 'approved').length,
      pendingBookings: clubBookings.filter((b) => b.status === 'pending').length,
    };
  });

  return NextResponse.json({ clubs });
}
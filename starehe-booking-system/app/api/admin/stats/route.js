// app/api/admin/stats/route.js
// GET — aggregate counts for the admin overview dashboard.
// Uses the service-role client since this reads across every user's data,
// which normal RLS policies intentionally don't allow for non-admins.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const admin = createAdminClient();

    const [
      { count: totalUsers, error: usersError },
      { count: totalClubs, error: clubsError },
      { data: bookings, error: bookingsError },
      { data: resources, error: resourcesError },
      { count: pendingReturns, error: maintenanceError },
    ] = await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }),
      admin.from('club_patrons').select('*', { count: 'exact', head: true }),
      admin.from('bookings').select('status'),
      admin.from('resources').select('resource_type, status'),
      admin.from('resources').select('*', { count: 'exact', head: true }).eq('status', 'maintenance'),
    ]);

    // Surface the FIRST real Postgres/Supabase error instead of silently
    // treating missing/broken tables as "zero results".
    const firstError = usersError || clubsError || bookingsError || resourcesError || maintenanceError;
    if (firstError) {
      console.error('Admin stats query error:', firstError);
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const bookingCounts = {
      total: bookings?.length || 0,
      pending: bookings?.filter((b) => b.status === 'pending').length || 0,
      approved: bookings?.filter((b) => b.status === 'approved').length || 0,
      rejected: bookings?.filter((b) => b.status === 'rejected').length || 0,
      completed: bookings?.filter((b) => b.status === 'completed').length || 0,
    };

    const resourceCounts = {
      total: resources?.length || 0,
      available: resources?.filter((r) => r.status === 'available').length || 0,
      booked: resources?.filter((r) => r.status === 'booked' || r.status === 'in_use').length || 0,
      maintenance: resources?.filter((r) => r.status === 'maintenance').length || 0,
    };

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalClubs: totalClubs || 0,
      bookingCounts,
      resourceCounts,
      pendingMaintenance: pendingReturns || 0,
    });
  } catch (error) {
    // This is the block that was missing — it's what was letting the crash
    // through as an empty 500 with no message at all.
    console.error('Admin stats route crashed:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong loading stats.' }, { status: 500 });
  }
}
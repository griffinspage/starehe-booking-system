// app/api/approvals/review/route.js
// GET ?bookingId=... — lets an approver (SM1-SM4, Welfare Head, or admin)
// view the booking's master list, its student rows, and the requisition —
// everything they need to actually review before approving and signing.
// Uses the normal (non-admin) client so Row Level Security still applies —
// the existing "*_via_booking" policies already permit staff roles to read
// these tables, this route just adds an explicit role check on top.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const APPROVER_ROLES = ['sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin'];

export async function GET(request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!APPROVER_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: 'Approver access required.' }, { status: 403 });
  }

  const bookingId = request.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();
  if (bookingError || !booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });

  const { data: masterList } = await supabase
    .from('master_lists')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  let students = [];
  if (masterList) {
    const { data } = await supabase
      .from('master_list_students')
      .select('*')
      .eq('master_list_id', masterList.id)
      .order('row_number', { ascending: true });
    students = data || [];
  }

  const { data: requisition } = await supabase
    .from('requisitions')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return NextResponse.json({ booking, masterList, students, requisition });
}
// app/api/inventory/return/route.js
// POST { bookingId, condition, comments } — records the return of a resource:
//   1. Inserts a row into `returns`
//   2. Updates the resource: status back to 'available' (or 'maintenance' if
//      the condition indicates damage), clears current_holder
//   3. Marks the booking's return_status as 'returned'
//   4. Logs the action in `inventory_logs`

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { bookingId, condition, comments } = await request.json();

    if (!bookingId || !condition) {
      return NextResponse.json({ error: 'bookingId and condition are required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, resources(*)')
      .eq('id', bookingId)
      .eq('club_patron_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or not yours.' }, { status: 404 });
    }

    if (!booking.resource_id) {
      return NextResponse.json({ error: 'This booking has no resource to return.' }, { status: 400 });
    }

    const needsMaintenance = condition === 'damaged';

    const { error: returnError } = await supabase.from('returns').insert({
      booking_id: bookingId,
      resource_id: booking.resource_id,
      condition,
      comments: comments || null,
    });
    if (returnError) throw returnError;

    const { error: resourceError } = await supabase
      .from('resources')
      .update({
        status: needsMaintenance ? 'maintenance' : 'available',
        current_holder: null,
        returned_date: new Date().toISOString().slice(0, 10),
        condition,
      })
      .eq('id', booking.resource_id);
    if (resourceError) throw resourceError;

    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({ return_status: 'returned', status: 'completed' })
      .eq('id', bookingId);
    if (updateBookingError) throw updateBookingError;

    await supabase.from('inventory_logs').insert({
      resource_id: booking.resource_id,
      booking_id: bookingId,
      action: needsMaintenance ? 'maintenance_flagged' : 'returned',
      actor_id: user.id,
      notes: comments || null,
    });

    await supabase.from('notifications').insert({
      user_id: user.id,
      booking_id: bookingId,
      type: 'resource_returned',
      message: `${booking.resources?.identifier || 'Resource'} was marked as returned${needsMaintenance ? ' and flagged for maintenance' : ''}.`,
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Return recording error:', error);
    return NextResponse.json({ error: 'Something went wrong recording the return.' }, { status: 500 });
  }
}
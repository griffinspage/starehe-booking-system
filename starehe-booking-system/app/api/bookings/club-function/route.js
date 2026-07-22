// app/api/bookings/club-function/route.js
// POST — creates a club function booking for the logged-in Club Patron.
// Enforces the three-day rule server-side too, since client-side checks can be bypassed.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookResourceSchema, validateThreeDayRule } from '@/utils/validation';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to book a function.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bookResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { functionName, functionDate, venue, purpose, expectedStudents, resources, quantity, specialRequirements } =
      parsed.data;

    const { valid, message } = validateThreeDayRule(functionDate);
    if (!valid) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_type: 'club_function',
        club_patron_id: user.id,
        function_name: functionName,
        booking_date: functionDate,
        venue,
        purpose,
        expected_students: expectedStudents,
        resource_type: resources[0], // primary resource; requisition captures the full list
        quantity,
        special_requirements: specialRequirements || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Seed the five-stage approval chain for this booking
    const chain = [
      { role: 'sm1', order: 1 },
      { role: 'sm2', order: 2 },
      { role: 'sm3', order: 3 },
      { role: 'sm4', order: 4 },
      { role: 'welfare_head', order: 5 },
    ];

    await supabase.from('approvals').insert(
      chain.map((step) => ({
        booking_id: booking.id,
        approver_role: step.role,
        sequence_order: step.order,
      }))
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Club function booking error:', error);
    return NextResponse.json({ error: 'Something went wrong creating the booking.' }, { status: 500 });
  }
}

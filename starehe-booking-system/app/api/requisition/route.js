// app/api/requisition/route.js
// GET  — fetch the requisition for a booking (if it exists).
// POST — upsert the requisition tied to a booking.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  const { data: requisition } = await supabase
    .from('requisitions')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return NextResponse.json({ requisition });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, submit, ...fields } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    const payload = {
      booking_id: bookingId,
      needs_bus: !!fields.needsBus,
      needs_food: !!fields.needsFood,
      needs_water: !!fields.needsWater,
      needs_projector: !!fields.needsProjector,
      needs_computer_lab: !!fields.needsComputerLab,
      needs_sound_system: !!fields.needsSoundSystem,
      needs_microphone: !!fields.needsMicrophone,
      needs_other: !!fields.needsOther,
      other_description: fields.otherDescription || null,
      requirements_description: fields.requirementsDescription || null,
      estimated_students: fields.estimatedStudents || null,
      departure_time: fields.departureTime || null,
      return_time: fields.returnTime || null,
      special_notes: fields.specialNotes || null,
      status: submit ? 'submitted' : 'draft',
    };

    const { data: existing } = await supabase
      .from('requisitions')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    let requisition;
    if (existing) {
      const { data, error } = await supabase
        .from('requisitions')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      requisition = data;
    } else {
      const { data, error } = await supabase.from('requisitions').insert(payload).select().single();
      if (error) throw error;
      requisition = data;
    }

    // Once submitted, this booking is ready for the approval chain — notify the first approver.
    if (submit) {
      const { data: sm1Approval } = await supabase
        .from('approvals')
        .select('id, approver_id')
        .eq('booking_id', bookingId)
        .eq('approver_role', 'sm1')
        .maybeSingle();

      if (sm1Approval?.approver_id) {
        await supabase.from('notifications').insert({
          user_id: sm1Approval.approver_id,
          booking_id: bookingId,
          type: 'pending_approval',
          message: 'A new club function is awaiting your approval.',
        });
      }
    }

    return NextResponse.json({ requisition }, { status: 200 });
  } catch (error) {
    console.error('Requisition save error:', error);
    return NextResponse.json({ error: 'Could not save the requisition form.' }, { status: 500 });
  }
}

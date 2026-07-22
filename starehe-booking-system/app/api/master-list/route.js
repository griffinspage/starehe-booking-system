// app/api/master-list/route.js
// POST — creates or updates the master list header for a booking (upsert on booking_id).
// GET  — fetches the master list (+ its student rows) for a given bookingId.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();

  let { data: masterList } = await supabase
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

  return NextResponse.json({ booking, masterList, students });
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
    const { bookingId, functionName, clubName, venue, functionDate, functionTime, teacherInCharge, purpose, submit } =
      body;

    if (!bookingId || !functionName || !clubName || !functionDate) {
      return NextResponse.json({ error: 'Missing required master list fields.' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('master_lists')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    const payload = {
      booking_id: bookingId,
      function_name: functionName,
      club_name: clubName,
      venue,
      function_date: functionDate,
      function_time: functionTime || null,
      teacher_in_charge: teacherInCharge,
      purpose,
      status: submit ? 'submitted' : 'draft',
    };

    let masterList;
    if (existing) {
      const { data, error } = await supabase
        .from('master_lists')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      masterList = data;
    } else {
      const { data, error } = await supabase.from('master_lists').insert(payload).select().single();
      if (error) throw error;
      masterList = data;
    }

    return NextResponse.json({ masterList }, { status: 200 });
  } catch (error) {
    console.error('Master list save error:', error);
    return NextResponse.json({ error: 'Could not save the master list.' }, { status: 500 });
  }
}

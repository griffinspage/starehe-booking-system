import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const q = searchParams.get('q');

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('club_patron_id', user.id);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (q) {
      query = query.or(
        `function_name.ilike.%${q}%,booking_number.ilike.%${q}%,resource_type.ilike.%${q}%`
      );
    }

    query = query.order('created_at', { ascending: false });

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Load bookings error:', error);

    return NextResponse.json(
      {
        error: 'Could not load bookings.',
      },
      {
        status: 500,
      }
    );
  }
}
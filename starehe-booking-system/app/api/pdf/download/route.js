export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  try {
    // --------------------------------------------------
    // 1. Verify logged-in user
    // --------------------------------------------------
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Get booking ID
    // --------------------------------------------------
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Use admin client to verify ownership
    // --------------------------------------------------
    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, club_patron_id, status, pdf_path')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Make sure this booking belongs to the user
    // --------------------------------------------------
    if (booking.club_patron_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this PDF.' },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 5. Make sure PDF exists
    // --------------------------------------------------
    if (!booking.pdf_path) {
      return NextResponse.json(
        { error: 'The approved PDF is not available yet.' },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 6. Make sure booking is approved
    // --------------------------------------------------
    if (booking.status !== 'approved') {
      return NextResponse.json(
        { error: 'The booking has not been fully approved yet.' },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 7. Create temporary signed URL
    // --------------------------------------------------
    const { data: signedUrlData, error: signedUrlError } =
      await admin.storage
        .from('documents')
        .createSignedUrl(
          booking.pdf_path,
          60 * 5
        );

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        'PDF signed URL error:',
        signedUrlError
      );

      return NextResponse.json(
        { error: 'Could not create PDF download link.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 8. Return temporary URL
    // --------------------------------------------------
    return NextResponse.json({
      url: signedUrlData.signedUrl,
    });
  } catch (error) {
    console.error(
      'PDF download error:',
      error
    );

    return NextResponse.json(
      { error: 'Could not access the PDF.' },
      { status: 500 }
    );
  }
}
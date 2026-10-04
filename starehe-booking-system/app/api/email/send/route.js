export const dynamic = 'force-dynamic';

// app/api/email/send/route.js
// POST { bookingId, pdfPath }
// Sends the approved-function email with the generated PDF attached.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTransport } from '@/emails/transport';
import { functionApprovedTemplate } from '@/emails/FunctionApprovedTemplate';

export async function POST(request) {
  try {
    const { bookingId, pdfPath } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    if (!pdfPath) {
      return NextResponse.json(
        { error: 'pdfPath is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // --------------------------------------------------
    // 1. Get booking
    // --------------------------------------------------
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Get patron email
    // --------------------------------------------------
    const { data: patron, error: patronError } = await admin
      .from('users')
      .select('email, club_name')
      .eq('id', booking.club_patron_id)
      .single();

    if (patronError || !patron?.email) {
      return NextResponse.json(
        { error: 'No recipient email on file.' },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 3. Download approved PDF
    // --------------------------------------------------
    const { data: fileData, error: downloadError } = await admin.storage
      .from('documents')
      .download(pdfPath);

    if (downloadError || !fileData) {
      console.error(
        'Approved PDF download failed:',
        downloadError
      );

      return NextResponse.json(
        { error: 'Could not retrieve the approved PDF.' },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(
      await fileData.arrayBuffer()
    );

    const attachments = [
      {
        filename: 'approved-function.pdf',
        content: buffer,
        contentType: 'application/pdf',
      },
    ];

    // --------------------------------------------------
    // 4. Build email
    // --------------------------------------------------
    const { subject, text, html } = functionApprovedTemplate({
      clubName: patron.club_name,
      functionName: booking.function_name,
      bookingNumber: booking.booking_number,
      schoolName:
        process.env.NEXT_PUBLIC_SCHOOL_NAME ||
        "Starehe Boys' Centre",
    });

    // --------------------------------------------------
    // 5. Send email
    // --------------------------------------------------
    const transport = getTransport();

    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: patron.email,
        subject,
        text,
        html,
        attachments,
      });
    } catch (sendError) {
      console.error(
        'SMTP send failed:',
        sendError
      );

      // Record failed attempt
      await admin.from('emails').insert({
        booking_id: bookingId,
        recipient_email: patron.email,
        subject,
        status: 'failed',
      });

      return NextResponse.json(
        {
          error: 'The approval email could not be sent.',
          recipient: patron.email,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 6. Record successful email
    // --------------------------------------------------
    const { error: emailLogError } = await admin
      .from('emails')
      .insert({
        booking_id: bookingId,
        recipient_email: patron.email,
        subject,
        status: 'sent',
      });

    if (emailLogError) {
      console.error(
        'Failed to log successful email:',
        emailLogError
      );

      // The email DID send, so we don't report the entire operation
      // as failed just because logging failed.
    }

    // --------------------------------------------------
    // 7. Notify patron
    // --------------------------------------------------
    if (booking.club_patron_id) {
      const { error: notificationError } = await admin
        .from('notifications')
        .insert({
          user_id: booking.club_patron_id,
          booking_id: bookingId,
          type: 'email_sent',
          message: `Approval email with your PDF was sent to ${patron.email}.`,
        });

      if (notificationError) {
        console.error(
          'Failed to create email notification:',
          notificationError
        );
      }
    }

    return NextResponse.json({
      status: 'sent',
      recipient: patron.email,
      attachedPdf: true,
    });
  } catch (error) {
    console.error(
      'Email send error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not send the email.',
      },
      { status: 500 }
    );
  }
}
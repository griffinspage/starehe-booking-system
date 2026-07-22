// app/api/email/send/route.js
// POST { bookingId, pdfPath } — sends the "Function Approved" email to the
// club patron's registered email with the generated PDF attached, and logs
// the send in the `emails` table + a notification row.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTransport } from '@/emails/transport';
import { functionApprovedTemplate } from '@/emails/functionApprovedTemplate.';

export async function POST(request) {
  try {
    const { bookingId, pdfPath } = await request.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    const admin = createAdminClient();

    const { data: booking } = await admin.from('bookings').select('*').eq('id', bookingId).single();
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const { data: patron } = await admin.from('users').select('email, club_name').eq('id', booking.club_patron_id).single();
    if (!patron?.email) return NextResponse.json({ error: 'No recipient email on file' }, { status: 404 });

    let attachments = [];
    if (pdfPath) {
      const { data: fileData } = await admin.storage.from('documents').download(pdfPath);
      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        attachments = [{ filename: 'approved-function.pdf', content: buffer, contentType: 'application/pdf' }];
      }
    }

    const { subject, text, html } = functionApprovedTemplate({
      clubName: patron.club_name,
      functionName: booking.function_name,
      bookingNumber: booking.booking_number,
      schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || "Starehe Boys' Centre",
    });

    const transport = getTransport();

    let status = 'sent';
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
      console.error('SMTP send failed:', sendError);
      status = 'failed';
    }

    await admin.from('emails').insert({
      booking_id: bookingId,
      recipient_email: patron.email,
      subject,
      status,
    });

    if (status === 'sent' && booking.club_patron_id) {
      await admin.from('notifications').insert({
        user_id: booking.club_patron_id,
        booking_id: bookingId,
        type: 'email_sent',
        message: `Approval email with your PDF was sent to ${patron.email}.`,
      });
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Could not send the email.' }, { status: 500 });
  }
}
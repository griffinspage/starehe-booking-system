export const dynamic = 'force-dynamic';

// app/api/pdf/generate/route.js
// POST { bookingId, sendEmail }
// Generates the final approved PDF, stores it in Supabase Storage,
// and optionally waits for the approval email to be sent.

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import ApprovedFunctionDocument from '@/pdf/ApprovedFunctionDocument';

export async function POST(request) {
  try {
    const { bookingId, sendEmail = false } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
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
    // 2. Get master list
    // --------------------------------------------------
    const { data: masterList, error: masterListError } =
      await admin
        .from('master_lists')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

    if (masterListError) {
      console.error(
        'Master list fetch error:',
        masterListError
      );

      return NextResponse.json(
        { error: 'Could not retrieve the master list.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. Get students
    // --------------------------------------------------
    let students = [];

    if (masterList) {
      const { data, error: studentsError } = await admin
        .from('master_list_students')
        .select('*')
        .eq('master_list_id', masterList.id)
        .order('row_number', { ascending: true });

      if (studentsError) {
        console.error(
          'Master list students fetch error:',
          studentsError
        );

        return NextResponse.json(
          { error: 'Could not retrieve the master list students.' },
          { status: 500 }
        );
      }

      students = data || [];

      console.log(
        'PDF STUDENTS:',
        JSON.stringify(students, null, 2)
      );
    }

    // --------------------------------------------------
    // 4. Get requisition
    // --------------------------------------------------
    const { data: requisition, error: requisitionError } =
      await admin
        .from('requisitions')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

    if (requisitionError) {
      console.error(
        'Requisition fetch error:',
        requisitionError
      );

      return NextResponse.json(
        { error: 'Could not retrieve the requisition.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 5. Get approvals
    // --------------------------------------------------
    const { data: approvals, error: approvalsError } =
      await admin
        .from('approvals')
        .select('*')
        .eq('booking_id', bookingId)
        .order('sequence_order', { ascending: true });

    if (approvalsError) {
      console.error(
        'Approvals fetch error:',
        approvalsError
      );

      return NextResponse.json(
        { error: 'Could not retrieve approval records.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 6. Resolve signature images
    // --------------------------------------------------
    const signatureUrls = {};

    for (const approval of approvals || []) {
      if (!approval.signature_id) continue;

      const { data: signature, error: signatureError } =
        await admin
          .from('signatures')
          .select('*')
          .eq('id', approval.signature_id)
          .single();

      if (signatureError || !signature) {
        console.error(
          `Could not retrieve signature for approval ${approval.id}:`,
          signatureError
        );
        continue;
      }

      const { data: signedUrl, error: signedUrlError } =
        await admin.storage
          .from('signatures')
          .createSignedUrl(
            signature.storage_path,
            60 * 10
          );

      if (signedUrlError) {
        console.error(
          `Could not create signed URL for signature ${approval.id}:`,
          signedUrlError
        );
        continue;
      }

      if (signedUrl?.signedUrl) {
        signatureUrls[approval.id] = signedUrl.signedUrl;
      }
    }

    // --------------------------------------------------
    // 7. Generate PDF
    // --------------------------------------------------
    const pdfBuffer = await renderToBuffer(
      React.createElement(
        ApprovedFunctionDocument,
        {
          schoolName:
            process.env.NEXT_PUBLIC_SCHOOL_NAME ||
            "Starehe Boys' Centre",
          booking,
          masterList,
          students,
          requisition,
          approvals: approvals || [],
          signatureUrls,
        }
      )
    );

    // --------------------------------------------------
    // 8. Upload PDF
    // --------------------------------------------------
    const path = `${bookingId}/approved-function.pdf`;

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(
        path,
        pdfBuffer,
        {
          contentType: 'application/pdf',
          upsert: true,
        }
      );

    if (uploadError) {
      console.error(
        'PDF upload error:',
        uploadError
      );

      return NextResponse.json(
        { error: 'Could not upload the approved PDF.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 9. Save PDF path to booking
    // --------------------------------------------------
    const { error: bookingUpdateError } = await admin
      .from('bookings')
      .update({
        pdf_path: path,
      })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      console.error(
        'Failed to save PDF path:',
        bookingUpdateError
      );

      return NextResponse.json(
        { error: 'PDF was generated but could not be linked to the booking.' },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. Send approval email and WAIT for result
    // --------------------------------------------------
    if (sendEmail) {
      const origin = request.nextUrl.origin;

      let emailResponse;

      try {
        emailResponse = await fetch(
          `${origin}/api/email/send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId,
              pdfPath: path,
            }),
            cache: 'no-store',
          }
        );
      } catch (emailRequestError) {
        console.error(
          'Email request failed:',
          emailRequestError
        );

        return NextResponse.json(
          {
            error:
              'PDF was generated successfully, but the email request could not be completed.',
            pdfPath: path,
          },
          { status: 500 }
        );
      }

      let emailResult = {};

      try {
        emailResult = await emailResponse.json();
      } catch {
        emailResult = {};
      }

      if (!emailResponse.ok || emailResult.status !== 'sent') {
        console.error(
          'Approval email failed:',
          emailResult
        );

        return NextResponse.json(
          {
            error:
              emailResult.error ||
              'PDF was generated, but the approval email could not be sent.',
            pdfPath: path,
            emailStatus: emailResult.status || 'failed',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'success',
        path,
        emailStatus: 'sent',
        recipient: emailResult.recipient,
      });
    }

    // --------------------------------------------------
    // 11. Normal PDF generation without email
    // --------------------------------------------------
    const { data: publicUrlData } = admin.storage
      .from('documents')
      .getPublicUrl(path);

    return NextResponse.json({
      status: 'success',
      path,
      publicUrl: publicUrlData?.publicUrl,
      emailStatus: 'not_requested',
    });
  } catch (error) {
    console.error(
      'PDF generation error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not generate the PDF.',
      },
      { status: 500 }
    );
  }
}
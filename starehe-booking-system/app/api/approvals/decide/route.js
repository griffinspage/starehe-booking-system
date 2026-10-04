export const dynamic = 'force-dynamic';

// app/api/approvals/decide/route.js
// POST — records an approval/rejection, stores the signature,
// and on final approval waits for PDF generation + email delivery.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
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

    const formData = await request.formData();

    const approvalId = formData.get('approvalId');
    const decision = formData.get('decision');
    const comment = formData.get('comment') || '';
    const signatureFile = formData.get('signature');

    if (
      !approvalId ||
      !['approved', 'rejected'].includes(decision)
    ) {
      return NextResponse.json(
        { error: 'Invalid request.' },
        { status: 400 }
      );
    }

    if (decision === 'approved' && !signatureFile) {
      return NextResponse.json(
        {
          error:
            'A signature is required to approve.',
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // --------------------------------------------------
    // 1. Get approval + booking
    // --------------------------------------------------
    const {
      data: approval,
      error: approvalFetchError,
    } = await admin
      .from('approvals')
      .select('*, bookings(*)')
      .eq('id', approvalId)
      .single();

    if (approvalFetchError || !approval) {
      return NextResponse.json(
        { error: 'Approval not found.' },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Prevent duplicate decisions
    // --------------------------------------------------
    if (approval.decision) {
      return NextResponse.json(
        {
          error:
            `This approval has already been ${approval.decision}.`,
        },
        { status: 409 }
      );
    }

    let signatureId = null;

    // --------------------------------------------------
    // 3. Save signature
    // --------------------------------------------------
    if (decision === 'approved' && signatureFile) {
      const path =
        `${approval.booking_id}/` +
        `${approval.approver_role}-${Date.now()}.png`;

      const arrayBuffer =
        await signatureFile.arrayBuffer();

      const { error: uploadError } =
        await admin.storage
          .from('signatures')
          .upload(
            path,
            Buffer.from(arrayBuffer),
            {
              contentType: 'image/png',
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: signature,
        error: sigInsertError,
      } = await admin
        .from('signatures')
        .insert({
          approval_id: approvalId,
          signer_id: user.id,
          signer_role: approval.approver_role,
          storage_path: path,
        })
        .select()
        .single();

      if (sigInsertError) {
        throw sigInsertError;
      }

      signatureId = signature.id;
    }

    // --------------------------------------------------
    // 4. Update approval
    // --------------------------------------------------
    const { error: updateError } =
      await admin
        .from('approvals')
        .update({
          decision,
          comment,
          signature_id: signatureId,
          approver_id: user.id,
          decided_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

    if (updateError) {
      throw updateError;
    }

    const bookingId = approval.booking_id;

    // --------------------------------------------------
    // 5. Rejection
    // --------------------------------------------------
    if (decision === 'rejected') {
      const {
        error: bookingRejectError,
      } = await admin
        .from('bookings')
        .update({
          status: 'rejected',
        })
        .eq('id', bookingId);

      if (bookingRejectError) {
        throw bookingRejectError;
      }

      const { data: booking } =
        await admin
          .from('bookings')
          .select('club_patron_id')
          .eq('id', bookingId)
          .single();

      if (booking?.club_patron_id) {
        await admin
          .from('notifications')
          .insert({
            user_id: booking.club_patron_id,
            booking_id: bookingId,
            type: 'booking_rejected',
            message:
              `Your booking was rejected at the ` +
              `${approval.approver_role.toUpperCase()} stage.` +
              `${comment ? ` Reason: ${comment}` : ''}`,
          });
      }

      // Rejection email remains background for now.
      // We are focusing this reliability improvement on
      // the final approval PDF + email pipeline.
      const origin = request.nextUrl.origin;

      fetch(
        `${origin}/api/email/send-rejection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            approverRole:
              approval.approver_role,
            reason: comment,
          }),
          cache: 'no-store',
        }
      ).catch((err) =>
        console.error(
          'Rejection email trigger failed:',
          err
        )
      );

      return NextResponse.json({
        status: 'rejected',
      });
    }

    // --------------------------------------------------
    // 6. FINAL APPROVAL — WELFARE HEAD
    // --------------------------------------------------
    if (approval.sequence_order === 5) {
      const {
        error: bookingApproveError,
      } = await admin
        .from('bookings')
        .update({
          status: 'approved',
        })
        .eq('id', bookingId);

      if (bookingApproveError) {
        throw bookingApproveError;
      }

      const {
        data: booking,
        error: bookingFetchError,
      } = await admin
        .from('bookings')
        .select(
          'club_patron_id, function_name'
        )
        .eq('id', bookingId)
        .single();

      if (bookingFetchError) {
        throw bookingFetchError;
      }

      /*
       * IMPORTANT:
       * Do NOT tell the patron that the PDF/email is
       * complete yet.
       *
       * We first wait for PDF generation and email.
       */

      const origin = request.nextUrl.origin;

      let pdfResponse;

      try {
        pdfResponse = await fetch(
          `${origin}/api/pdf/generate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId,
              sendEmail: true,
            }),
            cache: 'no-store',
          }
        );
      } catch (pdfRequestError) {
        console.error(
          'PDF generation request failed:',
          pdfRequestError
        );

        if (booking?.club_patron_id) {
          await admin
            .from('notifications')
            .insert({
              user_id:
                booking.club_patron_id,
              booking_id: bookingId,
              type: 'approval_processing_failed',
              message:
                `"${booking.function_name || 'Your function'}" ` +
                `was approved, but the final PDF/email ` +
                `processing failed. Please contact the Student Welfare Office.`,
            });
        }

        return NextResponse.json(
          {
            error:
              'The booking was approved, but PDF generation could not be completed.',
            status: 'approved_pdf_failed',
          },
          { status: 500 }
        );
      }

      let pdfResult = {};

      try {
        pdfResult = await pdfResponse.json();
      } catch {
        pdfResult = {};
      }

      if (
        !pdfResponse.ok ||
        pdfResult.status !== 'success' ||
        pdfResult.emailStatus !== 'sent'
      ) {
        console.error(
          'Final approval processing failed:',
          pdfResult
        );

        if (booking?.club_patron_id) {
          await admin
            .from('notifications')
            .insert({
              user_id:
                booking.club_patron_id,
              booking_id: bookingId,
              type: 'approval_processing_failed',
              message:
                `"${booking.function_name || 'Your function'}" ` +
                `was approved, but the final PDF/email ` +
                `processing failed. Please contact the Student Welfare Office.`,
            });
        }

        return NextResponse.json(
          {
            error:
              pdfResult.error ||
              'The booking was approved, but the final PDF/email processing failed.',
            status: 'approved_pdf_or_email_failed',
            pdfPath: pdfResult.pdfPath || null,
            emailStatus:
              pdfResult.emailStatus || 'failed',
          },
          { status: 500 }
        );
      }

      // --------------------------------------------------
      // 7. Everything succeeded
      // --------------------------------------------------
      if (booking?.club_patron_id) {
        await admin
          .from('notifications')
          .insert({
            user_id:
              booking.club_patron_id,
            booking_id: bookingId,
            type: 'booking_approved',
            message:
              `"${booking.function_name || 'Your function'}" ` +
              `has been fully approved. Your signed PDF ` +
              `has been generated and the approval email ` +
              `was sent successfully.`,
          });
      }

      return NextResponse.json({
        status: 'approved',
        pdfStatus: 'generated',
        emailStatus: 'sent',
      });
    }

    // --------------------------------------------------
    // 8. NON-FINAL APPROVAL
    // --------------------------------------------------

    const { data: booking } =
      await admin
        .from('bookings')
        .select(
          'club_patron_id, function_name'
        )
        .eq('id', bookingId)
        .single();

    if (booking?.club_patron_id) {
      await admin
        .from('notifications')
        .insert({
          user_id:
            booking.club_patron_id,
          booking_id: bookingId,
          type: 'pending_approval',
          message:
            `"${booking.function_name || 'Your function'}" ` +
            `was approved by ` +
            `${approval.approver_role.toUpperCase()} ` +
            `and is now with the next approver.`,
        });
    }

    // --------------------------------------------------
    // 9. Notify next approver(s)
    // --------------------------------------------------
    const nextSequence =
      approval.sequence_order + 1;

    const {
      data: nextApproval,
    } = await admin
      .from('approvals')
      .select('approver_role')
      .eq('booking_id', bookingId)
      .eq(
        'sequence_order',
        nextSequence
      )
      .maybeSingle();

    if (nextApproval) {
      const { data: nextUsers } =
        await admin
          .from('users')
          .select('id')
          .eq(
            'role',
            nextApproval.approver_role
          );

      if (
        nextUsers &&
        nextUsers.length > 0
      ) {
        const notifications =
          nextUsers.map((u) => ({
            user_id: u.id,
            booking_id: bookingId,
            type: 'pending_approval',
            message:
              `A club function is now awaiting ` +
              `your approval after being approved by ` +
              `${approval.approver_role.toUpperCase()}.`,
          }));

        await admin
          .from('notifications')
          .insert(
            notifications
          );
      }
    }

    return NextResponse.json({
      status: 'approved',
    });
  } catch (error) {
    console.error(
      'Approval decision error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong recording the decision.',
      },
      { status: 500 }
    );
  }
}
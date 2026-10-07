export const dynamic = 'force-dynamic';

// app/api/approvals/decide/route.js
// POST — records an approval/rejection, stores the signature,
// and on final approval starts PDF generation + email delivery
// in the background.

import { NextResponse, after } from 'next/server';
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

    // --------------------------------------------------
    // 0. Validate request
    // --------------------------------------------------

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

    if (
      approval.decision &&
      approval.decision !== 'pending'
    ) {
      return NextResponse.json(
        {
          error:
            `This approval has already been ${approval.decision}.`,
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 2A. Verify the user's approver role
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            'Could not verify your user role.',
        },
        { status: 403 }
      );
    }

    if (profile.role !== approval.approver_role) {
      return NextResponse.json(
        {
          error:
            `You are not authorized to make this approval. ` +
            `This approval belongs to the ` +
            `${approval.approver_role.toUpperCase()} stage.`,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 2B. Enforce approval sequence
    // --------------------------------------------------
    //
    // An approval cannot proceed unless every previous
    // approval stage has been both approved and signed.
    //
    // Example:
    //
    // SM1 approved + signed
    //        ↓
    // SM2 can approve
    //
    // SM2 approved + signed
    //        ↓
    // SM3 can approve
    //
    // SM3 approved + signed
    //        ↓
    // SM4 can approve
    //
    // SM4 approved + signed
    //        ↓
    // Welfare Head can approve
    //

    if (
      approval.sequence_order > 1 &&
      decision === 'approved'
    ) {
      const {
        data: priorApprovals,
        error: priorApprovalsError,
      } = await admin
        .from('approvals')
        .select(
          'sequence_order, approver_role, decision, signature_id'
        )
        .eq(
          'booking_id',
          approval.booking_id
        )
        .lt(
          'sequence_order',
          approval.sequence_order
        )
        .order('sequence_order', {
          ascending: true,
        });

      if (priorApprovalsError) {
        throw priorApprovalsError;
      }

      const incompleteApproval = (
        priorApprovals || []
      ).find(
        (prior) =>
          prior.decision !== 'approved' ||
          !prior.signature_id
      );

      if (incompleteApproval) {
        return NextResponse.json(
          {
            error:
              `This approval cannot proceed because ` +
              `${incompleteApproval.approver_role.toUpperCase()} ` +
              `has not completed their approval and signature.`,
          },
          { status: 409 }
        );
      }
    }

    let signatureId = null;

    // --------------------------------------------------
    // 3. Save signature
    // --------------------------------------------------

    if (
      decision === 'approved' &&
      signatureFile
    ) {
      const path =
        `${approval.booking_id}/` +
        `${approval.approver_role}-${Date.now()}.png`;

      const arrayBuffer =
        await signatureFile.arrayBuffer();

      const {
        error: uploadError,
      } = await admin.storage
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

    const {
      error: updateError,
    } = await admin
      .from('approvals')
      .update({
        decision,
        comment,
        signature_id: signatureId,
        approver_id: user.id,
        decided_at:
          new Date().toISOString(),
      })
      .eq('id', approvalId);

    if (updateError) {
      throw updateError;
    }

    const bookingId =
      approval.booking_id;

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

      const {
        data: booking,
      } = await admin
        .from('bookings')
        .select(
          'club_patron_id'
        )
        .eq('id', bookingId)
        .single();

      if (booking?.club_patron_id) {
        await admin
          .from('notifications')
          .insert({
            user_id:
              booking.club_patron_id,
            booking_id:
              bookingId,
            type:
              'booking_rejected',
            message:
              `Your booking was rejected at the ` +
              `${approval.approver_role.toUpperCase()} stage.` +
              `${
                comment
                  ? ` Reason: ${comment}`
                  : ''
              }`,
          });
      }

      return NextResponse.json({
        status: 'rejected',
      });
    }

    // --------------------------------------------------
    // 6. FINAL APPROVAL — WELFARE HEAD
    // --------------------------------------------------

    if (
      approval.sequence_order === 5
    ) {
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

      // --------------------------------------------------
      // 7. PDF + EMAIL PROCESSING IN THE BACKGROUND
      // --------------------------------------------------
      //
      // The approval has already been saved and the booking
      // has already been marked as approved above.
      //
      // We do NOT wait for PDF generation or email delivery.
      // The browser receives the successful approval response
      // immediately while this processing continues.

      const origin =
        request.nextUrl.origin;

      after(async () => {
        try {
          const pdfResponse =
            await fetch(
              `${origin}/api/pdf/generate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                  Cookie:
                    request.headers.get(
                      'cookie'
                    ) || '',
                },
                body: JSON.stringify({
                  bookingId,
                  sendEmail: true,
                }),
                cache: 'no-store',
              }
            );

          let pdfResult = {};

          try {
            pdfResult =
              await pdfResponse.json();
          } catch {
            pdfResult = {};
          }

          // --------------------------------------------------
          // Background PDF/email failure
          // --------------------------------------------------

          if (
            !pdfResponse.ok ||
            pdfResult.status !==
              'success' ||
            pdfResult.emailStatus !==
              'sent'
          ) {
            console.error(
              'Background PDF/email processing failed:',
              pdfResult
            );

            if (
              booking?.club_patron_id
            ) {
              await admin
                .from('notifications')
                .insert({
                  user_id:
                    booking.club_patron_id,
                  booking_id:
                    bookingId,
                  type:
                    'approval_processing_failed',
                  message:
                    `"${booking.function_name || 'Your function'}" ` +
                    `was approved, but the final PDF/email ` +
                    `processing failed. Please contact the Student Welfare Office.`,
                });
            }

            return;
          }

          // --------------------------------------------------
          // PDF + EMAIL COMPLETED SUCCESSFULLY
          // --------------------------------------------------

          if (
            booking?.club_patron_id
          ) {
            await admin
              .from('notifications')
              .insert({
                user_id:
                  booking.club_patron_id,
                booking_id:
                  bookingId,
                type:
                  'booking_approved',
                message:
                  `"${booking.function_name || 'Your function'}" ` +
                  `has been fully approved. Your signed PDF ` +
                  `has been generated and the approval email ` +
                  `was sent successfully.`,
              });
          }

          console.log(
            'Background PDF/email processing completed successfully:',
            {
              bookingId,
              pdfPath:
                pdfResult.path,
              recipient:
                pdfResult.recipient,
            }
          );
        } catch (error) {
          console.error(
            'Background PDF/email processing error:',
            error
          );

          if (
            booking?.club_patron_id
          ) {
            await admin
              .from('notifications')
              .insert({
                user_id:
                  booking.club_patron_id,
                booking_id:
                  bookingId,
                type:
                  'approval_processing_failed',
                message:
                  `"${booking.function_name || 'Your function'}" ` +
                  `was approved, but the final PDF/email ` +
                  `processing failed. Please contact the Student Welfare Office.`,
              });
          }
        }
      });

      // --------------------------------------------------
      // 8. APPROVAL SUCCESS — BACKGROUND PROCESSING CONTINUES
      // --------------------------------------------------

      return NextResponse.json({
        status: 'approved',
        message:
          'Approval successful. The approved PDF and email are being processed in the background.',
        pdfStatus:
          'processing',
        emailStatus:
          'processing',
      });
    }

    // --------------------------------------------------
    // 9. NON-FINAL APPROVAL
    // --------------------------------------------------

    const {
      data: booking,
    } = await admin
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
          booking_id:
            bookingId,
          type:
            'pending_approval',
          message:
            `"${booking.function_name || 'Your function'}" ` +
            `was approved by ` +
            `${approval.approver_role.toUpperCase()} ` +
            `and is now with the next approver.`,
        });
    }

    // --------------------------------------------------
    // 10. Notify next approver(s)
    // --------------------------------------------------

    const nextSequence =
      approval.sequence_order + 1;

    const {
      data: nextApproval,
    } = await admin
      .from('approvals')
      .select(
        'approver_role'
      )
      .eq(
        'booking_id',
        bookingId
      )
      .eq(
        'sequence_order',
        nextSequence
      )
      .maybeSingle();

    if (nextApproval) {
      const {
        data: nextUsers,
      } = await admin
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
          nextUsers.map(
            (u) => ({
              user_id: u.id,
              booking_id:
                bookingId,
              type:
                'pending_approval',
              message:
                `A club function is now awaiting ` +
                `your approval after being approved by ` +
                `${approval.approver_role.toUpperCase()}.`,
            })
          );

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
      'Error processing approval decision:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
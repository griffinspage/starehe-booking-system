// app/api/approvals/decide/route.js
// POST — records an approve/reject decision, uploads the signature image to
// Supabase Storage, and — if this was the final stage (Welfare Head) and it
// was an approval — flips the booking to "approved", locks editing, and
// triggers PDF + email (see /api/pdf and /api/email, called from here).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const formData = await request.formData();
    const approvalId = formData.get('approvalId');
    const decision = formData.get('decision'); // 'approved' | 'rejected'
    const comment = formData.get('comment') || '';
    const signatureFile = formData.get('signature'); // Blob, required only when approving

    if (!approvalId || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    if (decision === 'approved' && !signatureFile) {
      return NextResponse.json({ error: 'A signature is required to approve.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: approval, error: approvalFetchError } = await admin
      .from('approvals')
      .select('*, bookings(*)')
      .eq('id', approvalId)
      .single();

    if (approvalFetchError || !approval) {
      return NextResponse.json({ error: 'Approval not found.' }, { status: 404 });
    }

    let signatureId = null;

    if (decision === 'approved' && signatureFile) {
      const path = `${approval.booking_id}/${approval.approver_role}-${Date.now()}.png`;
      const arrayBuffer = await signatureFile.arrayBuffer();

      const { error: uploadError } = await admin.storage
        .from('signatures')
        .upload(path, Buffer.from(arrayBuffer), { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: signature, error: sigInsertError } = await admin
        .from('signatures')
        .insert({
          approval_id: approvalId,
          signer_id: user.id,
          signer_role: approval.approver_role,
          storage_path: path,
        })
        .select()
        .single();

      if (sigInsertError) throw sigInsertError;
      signatureId = signature.id;
    }

    const { error: updateError } = await admin
      .from('approvals')
      .update({
        decision,
        comment,
        signature_id: signatureId,
        approver_id: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq('id', approvalId);

    if (updateError) throw updateError;

    const bookingId = approval.booking_id;

    if (decision === 'rejected') {
      await admin.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);

      const { data: booking } = await admin.from('bookings').select('club_patron_id').eq('id', bookingId).single();
      if (booking?.club_patron_id) {
        await admin.from('notifications').insert({
          user_id: booking.club_patron_id,
          booking_id: bookingId,
          type: 'booking_rejected',
          message: `Your booking was rejected at the ${approval.approver_role.toUpperCase()} stage.${comment ? ` Reason: ${comment}` : ''}`,
        });
      }

      // Fire the rejection email in the background — don't block this response on SMTP latency
      const origin = request.nextUrl.origin;
      fetch(`${origin}/api/email/send-rejection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, approverRole: approval.approver_role, reason: comment }),
      }).catch((err) => console.error('Rejection email trigger failed:', err));

      return NextResponse.json({ status: 'rejected' });
    }

    // Approved — check if this was the final stage (Welfare Head, sequence 5)
    if (approval.sequence_order === 5) {
      await admin.from('bookings').update({ status: 'approved' }).eq('id', bookingId);

      const { data: booking } = await admin.from('bookings').select('club_patron_id, function_name').eq('id', bookingId).single();

      if (booking?.club_patron_id) {
        await admin.from('notifications').insert({
          user_id: booking.club_patron_id,
          booking_id: bookingId,
          type: 'booking_approved',
          message: `"${booking.function_name || 'Your function'}" has been fully approved. Your PDF and email are on the way.`,
        });
      }

      // Fire PDF generation + email in the background (best-effort — don't block the response)
      const origin = request.nextUrl.origin;
      fetch(`${origin}/api/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      }).catch((err) => console.error('PDF generation trigger failed:', err));
    } else {
      // Notify the club patron that their function moved forward one stage
      const { data: booking } = await admin.from('bookings').select('club_patron_id, function_name').eq('id', bookingId).single();
      if (booking?.club_patron_id) {
        await admin.from('notifications').insert({
          user_id: booking.club_patron_id,
          booking_id: bookingId,
          type: 'pending_approval',
          message: `"${booking.function_name || 'Your function'}" was approved by ${approval.approver_role.toUpperCase()} and is now with the next approver.`,
        });
      }
    }

    return NextResponse.json({ status: 'approved' });
  } catch (error) {
    console.error('Approval decision error:', error);
    return NextResponse.json({ error: 'Something went wrong recording the decision.' }, { status: 500 });
  }
}
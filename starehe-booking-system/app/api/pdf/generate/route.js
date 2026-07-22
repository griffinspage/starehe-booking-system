// app/api/pdf/generate/route.js
// POST { bookingId } — gathers the booking, master list, students, requisition,
// approvals, and signature images; renders the PDF; uploads it to the
// "documents" Supabase Storage bucket; then triggers /api/email/send.
// This is called automatically by /api/approvals/decide once the Welfare Head
// gives the final approval — it isn't meant to be hit directly by the UI,
// though the "Download PDF" button also calls it to regenerate on demand.

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import ApprovedFunctionDocument from '@/pdf/ApprovedFunctionDocument';

export async function POST(request) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    const admin = createAdminClient();

    const { data: booking } = await admin.from('bookings').select('*').eq('id', bookingId).single();
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const { data: masterList } = await admin.from('master_lists').select('*').eq('booking_id', bookingId).maybeSingle();

    let students = [];
    if (masterList) {
      const { data } = await admin
        .from('master_list_students')
        .select('*')
        .eq('master_list_id', masterList.id)
        .order('row_number', { ascending: true });
      students = data || [];
    }

    const { data: requisition } = await admin.from('requisitions').select('*').eq('booking_id', bookingId).maybeSingle();

    const { data: approvals } = await admin
      .from('approvals')
      .select('*')
      .eq('booking_id', bookingId)
      .order('sequence_order', { ascending: true });

    // Resolve each approval's signature to a signed URL react-pdf can fetch
    const signatureUrls = {};
    for (const approval of approvals || []) {
      if (!approval.signature_id) continue;
      const { data: signature } = await admin.from('signatures').select('*').eq('id', approval.signature_id).single();
      if (!signature) continue;
      const { data: signedUrl } = await admin.storage
        .from('signatures')
        .createSignedUrl(signature.storage_path, 60 * 10);
      if (signedUrl) signatureUrls[approval.id] = signedUrl.signedUrl;
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(ApprovedFunctionDocument, {
        schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || "Starehe Boys' Centre",
        booking,
        masterList,
        students,
        requisition,
        approvals: approvals || [],
        signatureUrls,
      })
    );

    const path = `${bookingId}/approved-function.pdf`;

    await admin.storage
      .from('documents')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    const { data: publicUrlData } = admin.storage.from('documents').getPublicUrl(path);

    await admin.from('bookings').update({ pdf_path: path }).eq('id', bookingId).select().maybeSingle();

    // Trigger the approval email in the background — don't block this response on SMTP latency
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, pdfPath: path }),
    }).catch((err) => console.error('Email trigger failed:', err));

    return NextResponse.json({ path, publicUrl: publicUrlData?.publicUrl });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Could not generate the PDF.' }, { status: 500 });
  }
}
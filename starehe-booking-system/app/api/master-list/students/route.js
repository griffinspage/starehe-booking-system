// app/api/master-list/students/route.js
// POST — bulk replace of all student rows for a master list (simplest correct model for a
// spreadsheet-style editor: the client sends the full current grid, we replace-all in one go).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { masterListId, rows } = body;

    if (!masterListId || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'masterListId and rows[] are required.' }, { status: 400 });
    }

    // Drop rows that are completely empty (Handsontable pads with blank rows at the bottom)
    const cleanRows = rows.filter((r) =>
      [r.admissionNumber, r.studentName, r.class, r.stream, r.phoneNumber, r.parentContact, r.remarks].some(
        (v) => v && String(v).trim().length > 0
      )
    );

    await supabase.from('master_list_students').delete().eq('master_list_id', masterListId);

    if (cleanRows.length > 0) {
      const { error } = await supabase.from('master_list_students').insert(
        cleanRows.map((r, index) => ({
          master_list_id: masterListId,
          row_number: index + 1,
          admission_number: r.admissionNumber || null,
          student_name: r.studentName || null,
          class: r.class || null,
          stream: r.stream || null,
          phone_number: r.phoneNumber || null,
          parent_contact: r.parentContact || null,
          remarks: r.remarks || null,
          attendance_status: r.attendanceStatus || 'expected',
        }))
      );
      if (error) throw error;
    }

    return NextResponse.json({ savedRows: cleanRows.length }, { status: 200 });
  } catch (error) {
    console.error('Master list students save error:', error);
    return NextResponse.json({ error: 'Could not save the student list.' }, { status: 500 });
  }
}

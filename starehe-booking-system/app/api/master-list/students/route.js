export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { masterListId, rows } = body;

    if (!masterListId || !Array.isArray(rows)) {
      return NextResponse.json(
        {
          error: 'masterListId and rows[] are required.',
        },
        { status: 400 }
      );
    }

    /*
     * Remove completely empty rows.
     */
    const cleanRows = rows.filter((r) =>
      [
        r.admissionNumber,
        r.studentName,
        r.class,
        r.stream,
        r.phoneNumber,
        r.parentContact,
        r.remarks,
      ].some(
        (v) =>
          v !== null &&
          v !== undefined &&
          String(v).trim().length > 0
      )
    );

    console.log('Master list save:', {
      userId: user.id,
      masterListId,
      receivedRows: rows.length,
      cleanRows: cleanRows.length,
      firstRow: cleanRows[0] || null,
    });

    /*
     * Replace all existing rows.
     */
    const { error: deleteError } = await supabase
      .from('master_list_students')
      .delete()
      .eq('master_list_id', masterListId);

    if (deleteError) {
      console.error(
        'Failed to delete old master-list rows:',
        deleteError
      );

      throw deleteError;
    }

    /*
     * Nothing to insert.
     */
    if (cleanRows.length === 0) {
      return NextResponse.json(
        {
          savedRows: 0,
          message: 'No student rows were provided.',
        },
        { status: 200 }
      );
    }

    /*
     * Insert the current student list.
     */
    const studentRows = cleanRows.map((r, index) => ({
      master_list_id: masterListId,
      row_number: index + 1,

      admission_number:
        r.admissionNumber?.trim() || null,

      student_name:
        r.studentName?.trim() || null,

      class:
        r.class?.trim() || null,

      stream:
        r.stream?.trim() || null,

      phone_number:
        r.phoneNumber?.trim() || null,

      parent_contact:
        r.parentContact?.trim() || null,

      remarks:
        r.remarks?.trim() || null,

      attendance_status:
        r.attendanceStatus || 'expected',
    }));

    const { data: insertedRows, error: insertError } =
      await supabase
        .from('master_list_students')
        .insert(studentRows)
        .select();

    if (insertError) {
      console.error(
        'Failed to insert master-list students:',
        insertError
      );

      throw insertError;
    }

    console.log(
      `Successfully saved ${insertedRows?.length || 0} student rows.`
    );

    return NextResponse.json(
      {
        savedRows: insertedRows?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'Master list students save error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not save the student list.',
      },
      { status: 500 }
    );
  }
}
// app/api/master-list/students/flag/route.js
// PATCH { studentId, flagType, comment } — an approver marks (or clears) a
// student as flagged for academic or disciplinary reasons. The student row
// itself is never removed; this just annotates it. flagType is one of
// 'academic', 'discipline', or null to clear an existing flag.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const APPROVER_ROLES = ['sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin'];

export async function PATCH(request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!APPROVER_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: 'Only approvers can flag students.' }, { status: 403 });
  }

  const { studentId, flagType, comment } = await request.json();

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }
  if (flagType && !['academic', 'discipline'].includes(flagType)) {
    return NextResponse.json({ error: 'flagType must be "academic", "discipline", or null.' }, { status: 400 });
  }

  const updates = flagType
    ? {
        flag_type: flagType,
        flagged_by: user.id,
        flagged_by_role: profile.role,
        flag_comment: comment || null,
        flagged_at: new Date().toISOString(),
      }
    : {
        // Clearing a flag wipes all the associated metadata too
        flag_type: null,
        flagged_by: null,
        flagged_by_role: null,
        flag_comment: null,
        flagged_at: null,
      };

  const { data, error } = await supabase
    .from('master_list_students')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ student: data });
}
// app/api/approvals/queue/route.js
// GET — returns bookings currently sitting at the logged-in approver's stage.
// A booking is "actionable" by a given role only once every earlier stage has
// been approved (sequence_order enforces the chain: SM1 -> SM2 -> SM3 -> SM4 -> Welfare Head).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ROLE_ORDER = { sm1: 1, sm2: 2, sm3: 3, sm4: 4, welfare_head: 5 };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = profile?.role;

  if (!ROLE_ORDER[role]) {
    return NextResponse.json({ error: 'You do not have an approver role.' }, { status: 403 });
  }

  const mySequence = ROLE_ORDER[role];

  // My pending approval rows
  const { data: myApprovals, error } = await supabase
    .from('approvals')
    .select('*, bookings(*)')
    .eq('approver_role', role)
    .eq('decision', 'pending');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actionable = [];
  for (const approval of myApprovals || []) {
    if (!approval.bookings || approval.bookings.status === 'rejected') continue;

    // All earlier-stage approvals for this booking must already be approved
    const { data: priorStages } = await supabase
      .from('approvals')
      .select('decision, sequence_order')
      .eq('booking_id', approval.booking_id)
      .lt('sequence_order', mySequence);

    const allPriorApproved = (priorStages || []).every((p) => p.decision === 'approved');

    if (allPriorApproved) {
      actionable.push(approval);
    }
  }

  return NextResponse.json({ approvals: actionable });
}
'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCheck, LuX, LuClipboardCheck, LuFileText } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import SignaturePad from '@/components/signature/SignaturePad';
import Link from 'next/link';


const ROLE_LABELS = {
  sm1: 'Senior Master 1',
  sm2: 'Senior Master 2',
  sm3: 'Senior Master 3',
  sm4: 'Senior Master 4',
  welfare_head: 'Head of Student Welfare',
};

function ApprovalRow({ approval, onDecided }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(null); // 'approved' | 'rejected' | null
  const padRef = useRef(null);
  const booking = approval.bookings;

  async function decide(decision) {
    if (decision === 'approved' && (padRef.current?.isEmpty() ?? true)) {
      toast.error('Please sign before approving.');
      return;
    }
    if (decision === 'rejected' && !comment.trim()) {
      toast.error('Please add a reason for rejecting.');
      return;
    }

    setSubmitting(decision);
    try {
      const formData = new FormData();
      formData.append('approvalId', approval.id);
      formData.append('decision', decision);
      formData.append('comment', comment);

      if (decision === 'approved') {
        const blob = await padRef.current.getBlob();
        formData.append('signature', blob, 'signature.png');
      }

      const res = await fetch('/api/approvals/decide', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not record the decision.');
        return;
      }

      toast.success(decision === 'approved' ? 'Approved and signed.' : 'Rejected.');
      onDecided(approval.id);
    } catch (err) {
      console.error(err);
      toast.error('Network error — please try again.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{booking?.function_name || 'Club Function'}</p>
          <p className="mt-0.5 text-xs text-ink-faint font-mono">{booking?.booking_number}</p>
        </div>
        <div className="text-right text-xs text-ink-muted">
          <p>{booking?.venue}</p>
          <p>{booking?.booking_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-ink-muted sm:grid-cols-2">
        <p><span className="font-medium text-ink">Purpose:</span> {booking?.purpose || '—'}</p>
        <p><span className="font-medium text-ink">Expected students:</span> {booking?.expected_students ?? '—'}</p>
      </div>

      <Link
        href={`/approvals/review/${booking.id}`}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:underline"
      >
        <LuFileText className="h-4 w-4" /> View Master List & Requisition
      </Link>

      <Textarea
        label="Comment (required to reject)"
        placeholder="Optional note for approval, required if rejecting"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />

      <div>
        <p className="label">Your Signature</p>
        <SignaturePad ref={padRef} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="danger"
          className="sm:w-auto"
          icon={LuX}
          loading={submitting === 'rejected'}
          disabled={submitting !== null}
          onClick={() => decide('rejected')}
        >
          Reject
        </Button>
        <Button
          className="sm:w-auto"
          icon={LuCheck}
          loading={submitting === 'approved'}
          disabled={submitting !== null}
          onClick={() => decide('approved')}
        >
          Approve
        </Button>
      </div>
    </Card>
  );
}

export default function ApprovalQueue({ role }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/approvals/queue');
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load your approval queue.');
    } finally {
      setLoading(false);
    }
  }

  function handleDecided(approvalId) {
    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuClipboardCheck className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{ROLE_LABELS[role]} — Approvals</h1>
          <p className="text-sm text-ink-muted">Functions waiting on your review and signature.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading queue…</p>
      ) : approvals.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-ink-faint">Nothing is waiting on you right now.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalRow key={approval.id} approval={approval} onDecided={handleDecided} />
          ))}
        </div>
      )}
    </div>
  );
}
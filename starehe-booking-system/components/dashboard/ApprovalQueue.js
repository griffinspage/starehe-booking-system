'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCheck, LuX, LuClipboardCheck, LuFileText, LuMapPin, LuCalendar, LuUsers, LuPenLine } from 'react-icons/lu';
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
    <Card className="relative overflow-hidden border-l-4 border-l-gold-500 space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="inline-block rounded-md bg-navy-50 px-2.5 py-0.5 text-[11px] font-bold text-navy-700 tracking-wide">
            PENDING YOUR ACTION
          </span>
          <h3 className="font-display mt-1 text-lg font-bold text-navy-900">
            {booking?.function_name || 'Club Function'}
          </h3>
          <p className="text-xs text-ink-faint font-mono mt-0.5">Booking Ref: #{booking?.booking_number}</p>
        </div>

        <div className="space-y-1 text-right text-xs text-ink-muted">
          <div className="flex items-center justify-end gap-1.5 font-medium text-ink">
            <LuMapPin className="h-3.5 w-3.5 text-navy-600" />
            <span>{booking?.venue || 'Venue TBD'}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-ink-faint">
            <LuCalendar className="h-3.5 w-3.5" />
            <span>{booking?.booking_date}</span>
          </div>
        </div>
      </div>

      {/* Purpose & Stats */}
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface-muted p-4 text-xs text-ink-muted sm:grid-cols-2">
        <div>
          <span className="block font-semibold uppercase tracking-wider text-ink-faint text-[10px]">Function Purpose</span>
          <p className="mt-0.5 text-ink font-medium leading-relaxed">{booking?.purpose || 'Not specified'}</p>
        </div>
        <div>
          <span className="block font-semibold uppercase tracking-wider text-ink-faint text-[10px]">Expected Attendance</span>
          <p className="mt-0.5 text-ink font-semibold flex items-center gap-1.5">
            <LuUsers className="h-4 w-4 text-navy-600" />
            <span>{booking?.expected_students ?? '—'} students</span>
          </p>
        </div>
      </div>

      {/* Document Review Link */}
      <div>
        <Link
          href={`/approvals/review/${booking.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-navy-50 border border-navy-100 px-3.5 py-2 text-xs font-bold text-navy-700 transition-colors hover:bg-navy-100"
        >
          <LuFileText className="h-4 w-4 text-navy-600" /> View Master List & Requisition Documents
        </Link>
      </div>

      {/* Comment */}
      <Textarea
        label="Review Comment (Required if rejecting)"
        placeholder="Add any specific conditions, notes, or rejection reasoning..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />

      {/* Digital Signature Container */}
      <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="label mb-0 flex items-center gap-1.5 text-navy-900">
            <LuPenLine className="h-3.5 w-3.5 text-gold-600" /> Official Digital Signature (Required for Approval)
          </label>
        </div>
        <SignaturePad ref={padRef} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          variant="danger"
          className="sm:w-auto px-6"
          icon={LuX}
          loading={submitting === 'rejected'}
          disabled={submitting !== null}
          onClick={() => decide('rejected')}
        >
          Reject Booking
        </Button>
        <Button
          variant="gold"
          className="sm:w-auto px-7"
          icon={LuCheck}
          loading={submitting === 'approved'}
          disabled={submitting !== null}
          onClick={() => decide('approved')}
        >
          Approve & Sign
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
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 border border-navy-100">
            <LuClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900">{ROLE_LABELS[role]} Queue</h1>
            <p className="text-xs text-ink-muted">Function requisitions waiting for your review and authorization.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-muted">Loading pending approvals queue...</p>
        </Card>
      ) : approvals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
            <LuCheck className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-navy-900">All Caught Up!</h3>
          <p className="mt-1 text-xs text-ink-muted">There are no booking requests waiting for your approval right now.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {approvals.map((approval) => (
            <ApprovalRow key={approval.id} approval={approval} onDecided={handleDecided} />
          ))}
        </div>
      )}
    </div>
  );
}
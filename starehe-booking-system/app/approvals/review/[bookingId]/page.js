'use client';

import toast from 'react-hot-toast';
import { LuStrikethrough, LuX as LuClear } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuTable, LuClipboardList } from 'react-icons/lu';
import Card from '@/components/ui/Card';

const REQUISITION_LABELS = [
  ['needs_bus', 'Bus'],
  ['needs_food', 'Food'],
  ['needs_water', 'Water'],
  ['needs_projector', 'Projector'],
  ['needs_computer_lab', 'Computer Laboratory'],
  ['needs_sound_system', 'Sound System'],
  ['needs_microphone', 'Microphone'],
  ['needs_other', 'Other'],
];

export default function ApprovalReviewPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/review?bookingId=${bookingId}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Could not load this booking.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function setFlag(studentId, flagType) {
    try {
      const res = await fetch('/api/master-list/students/flag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, flagType }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Could not update the flag.');
        return;
      }

      // Update just this one student in local state so the strike shows instantly
      setData((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === studentId ? json.student : s)),
      }));

      toast.success(flagType ? 'Student flagged.' : 'Flag cleared.');
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (!data) return <p className="text-sm text-ink-muted">Could not load this booking.</p>;

  const { booking, masterList, students, requisition } = data;
  const selectedItems = REQUISITION_LABELS.filter(([key]) => requisition?.[key]);

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <LuArrowLeft className="h-4 w-4" /> Back to queue
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {masterList?.function_name || booking.function_name || 'Function Review'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted font-mono">{booking.booking_number}</p>
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <LuTable className="h-4 w-4 text-navy-600" />
          <h2 className="text-sm font-semibold text-ink">Master List</h2>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-ink-muted">Club:</span> {masterList?.club_name || '—'}</p>
          <p><span className="text-ink-muted">Venue:</span> {masterList?.venue || '—'}</p>
          <p><span className="text-ink-muted">Date:</span> {masterList?.function_date || '—'}</p>
          <p><span className="text-ink-muted">Teacher in Charge:</span> {masterList?.teacher_in_charge || '—'}</p>
          <p className="sm:col-span-2"><span className="text-ink-muted">Purpose:</span> {masterList?.purpose || '—'}</p>
        </div>

        {students.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">No students have been added to the master list yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Adm No.</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Stream</th>
                  <th className="px-3 py-2">Attendance</th>
                  <th className="px-3 py-2">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s, i) => (
                  <tr key={s.id} className={s.flag_type ? 'bg-red-50/40' : ''}>
                    <td className="px-3 py-2 text-ink-faint">{i + 1}</td>
                    <td className="px-3 py-2">{s.admission_number}</td>
                    <td className="px-3 py-2 font-medium text-ink">
                      <span
                        style={
                          s.flag_type === 'academic'
                            ? { textDecoration: 'line-through', textDecorationColor: '#b3261e', textDecorationThickness: '2px' }
                            : s.flag_type === 'discipline'
                            ? {
                                textDecoration: 'line-through',
                                textDecorationColor: '#b3261e',
                                textDecorationThickness: '2px',
                                borderBottom: '2px solid #b3261e',
                                paddingBottom: '1px',
                              }
                            : undefined
                        }
                      >
                        {s.student_name}
                      </span>
                      {s.flag_type && (
                        <span className="ml-2 text-xs font-medium text-status-rejected">
                          ({s.flag_type === 'academic' ? 'Academic' : 'Indiscipline'})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{s.class}</td>
                    <td className="px-3 py-2">{s.stream}</td>
                    <td className="px-3 py-2">{s.attendance_status}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Flag: low academic performance (single strike)"
                          onClick={() => setFlag(s.id, s.flag_type === 'academic' ? null : 'academic')}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            s.flag_type === 'academic'
                              ? 'bg-status-rejected text-white'
                              : 'border border-border text-ink-faint hover:bg-surface-muted'
                          }`}
                        >
                          Academic
                        </button>
                        <button
                          type="button"
                          title="Flag: indiscipline (double strike)"
                          onClick={() => setFlag(s.id, s.flag_type === 'discipline' ? null : 'discipline')}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            s.flag_type === 'discipline'
                              ? 'bg-status-rejected text-white'
                              : 'border border-border text-ink-faint hover:bg-surface-muted'
                          }`}
                        >
                          Discipline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <LuClipboardList className="h-4 w-4 text-navy-600" />
          <h2 className="text-sm font-semibold text-ink">Requisition</h2>
        </div>

        {!requisition ? (
          <p className="text-sm text-ink-faint">No requisition submitted yet.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-ink-faint">No resources selected.</p>
              ) : (
                selectedItems.map(([key, label]) => (
                  <span key={key} className="badge bg-navy-50 text-navy-600">{label}</span>
                ))
              )}
            </div>
            {requisition.other_description && (
              <p className="mb-2 text-sm"><span className="text-ink-muted">Other:</span> {requisition.other_description}</p>
            )}
            <p className="mb-2 text-sm"><span className="text-ink-muted">Requirements:</span> {requisition.requirements_description || '—'}</p>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <p><span className="text-ink-muted">Est. Students:</span> {requisition.estimated_students ?? '—'}</p>
              <p><span className="text-ink-muted">Departure:</span> {requisition.departure_time || '—'}</p>
              <p><span className="text-ink-muted">Return:</span> {requisition.return_time || '—'}</p>
            </div>
            {requisition.special_notes && (
              <p className="mt-2 text-sm"><span className="text-ink-muted">Notes:</span> {requisition.special_notes}</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { LuTable, LuPenLine } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MasterListGrid from '@/components/forms/MasterListGrid';

const SIGNATORIES = [
  { role: 'sm1', label: 'Senior Master 1' },
  { role: 'sm2', label: 'Senior Master 2' },
  { role: 'sm3', label: 'Senior Master 3' },
  { role: 'sm4', label: 'Senior Master 4' },
  { role: 'welfare_head', label: 'Student Welfare Head' },
];

function MasterListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const gridRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterListId, setMasterListId] = useState(null);
  const [initialRows, setInitialRows] = useState([]);
  const [header, setHeader] = useState({
    functionName: '',
    clubName: '',
    venue: '',
    functionDate: '',
    functionTime: '',
    teacherInCharge: '',
    purpose: '',
  });

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/master-list?bookingId=${bookingId}`);
        const data = await res.json();

        if (data.booking) {
          setHeader((prev) => ({
            ...prev,
            functionName: data.masterList?.function_name || data.booking.function_name || '',
            clubName: data.masterList?.club_name || '',
            venue: data.masterList?.venue || data.booking.venue || '',
            functionDate: data.masterList?.function_date || data.booking.booking_date || '',
            functionTime: data.masterList?.function_time || '',
            teacherInCharge: data.masterList?.teacher_in_charge || '',
            purpose: data.masterList?.purpose || data.booking.purpose || '',
          }));
        }
        if (data.masterList) setMasterListId(data.masterList.id);
        if (data.students?.length) {
          setInitialRows(
            data.students.map((s) => ({
              admissionNumber: s.admission_number || '',
              studentName: s.student_name || '',
              class: s.class || '',
              stream: s.stream || '',
              phoneNumber: s.phone_number || '',
              parentContact: s.parent_contact || '',
              remarks: s.remarks || '',
              attendanceStatus: s.attendance_status || 'expected',
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load the master list.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bookingId]);

  async function saveAll({ submit }) {
    if (!bookingId) return;
    setSaving(true);
    try {
      const headerRes = await fetch('/api/master-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, ...header, submit }),
      });
      const headerData = await headerRes.json();
      if (!headerRes.ok) {
        toast.error(headerData.error || 'Could not save the master list header.');
        return false;
      }

      const listId = headerData.masterList.id;
      setMasterListId(listId);

      const rows = gridRef.current?.getRows() || [];
      const rowsRes = await fetch('/api/master-list/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterListId: listId, rows }),
      });
      const rowsData = await rowsRes.json();
      if (!rowsRes.ok) {
        toast.error(rowsData.error || 'Could not save student rows.');
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    const ok = await saveAll({ submit: false });
    if (ok) toast.success('Draft saved.');
  }

  async function handleContinue() {
    if (!header.functionName || !header.clubName || !header.functionDate) {
      toast.error('Fill in Function Name, Club Name, and Date of Function before continuing.');
      return;
    }
    const ok = await saveAll({ submit: true });
    if (ok) router.push(`/patron/requisition?bookingId=${bookingId}`);
  }

  if (!bookingId) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">
          Start a booking first from <span className="font-medium text-ink">Book Resources</span> — the master list
          is created for a specific function.
        </p>
        <Button className="mt-4" onClick={() => router.push('/patron/book-resource')}>
          Go to Book Resources
        </Button>
      </Card>
    );
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading master list…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuTable className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Master List</h1>
          <p className="text-sm text-ink-muted">Enter function details, then fill in the student list below.</p>
        </div>
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Function Name"
            value={header.functionName}
            onChange={(e) => setHeader({ ...header, functionName: e.target.value })}
          />
          <Input
            label="Club Name"
            value={header.clubName}
            onChange={(e) => setHeader({ ...header, clubName: e.target.value })}
          />
          <Input label="Venue" value={header.venue} onChange={(e) => setHeader({ ...header, venue: e.target.value })} />
          <Input
            type="date"
            label="Date of Function"
            value={header.functionDate}
            onChange={(e) => setHeader({ ...header, functionDate: e.target.value })}
          />
          <Input
            type="time"
            label="Time"
            value={header.functionTime}
            onChange={(e) => setHeader({ ...header, functionTime: e.target.value })}
          />
          <Input
            label="Teacher in Charge"
            value={header.teacherInCharge}
            onChange={(e) => setHeader({ ...header, teacherInCharge: e.target.value })}
          />
        </div>
        <div className="mt-5">
          <Textarea label="Purpose" value={header.purpose} onChange={(e) => setHeader({ ...header, purpose: e.target.value })} />
        </div>
      </Card>

      <Card className="mb-5 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-ink">Student List</p>
          <button
            type="button"
            onClick={() => gridRef.current?.addRow(5)}
            className="text-xs font-medium text-navy-600 hover:underline"
          >
            + Add 5 rows
          </button>
        </div>
        <div className="p-3">
          <MasterListGrid ref={gridRef} initialData={initialRows} />
        </div>
      </Card>

      <Card className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <LuPenLine className="h-4 w-4 text-navy-600" />
          <p className="text-sm font-semibold text-ink">Approval Signatures</p>
        </div>
        <p className="mb-4 text-xs text-ink-faint">
          Reserved for the approval chain — each signatory signs electronically once this master list reaches them.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SIGNATORIES.map((s) => (
            <div key={s.role} className="rounded-lg border border-dashed border-border p-4 text-center">
              <div className="mb-3 h-14 rounded-md bg-surface-muted" />
              <p className="text-xs font-medium text-ink">{s.label}</p>
              <p className="text-xs text-ink-faint">Date: —</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="sm:w-auto" loading={saving} onClick={handleSaveDraft}>
          Save Draft
        </Button>
        <Button className="sm:w-auto" loading={saving} onClick={handleContinue}>
          Continue to Requisition
        </Button>
      </div>
    </div>
  );
}

export default function MasterListPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <MasterListContent />
    </Suspense>
  );
}

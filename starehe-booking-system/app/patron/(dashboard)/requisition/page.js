'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { LuClipboardList, LuPenLine } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const RESOURCE_CHECKS = [
  { key: 'needsBus', label: 'Bus' },
  { key: 'needsFood', label: 'Food' },
  { key: 'needsWater', label: 'Water' },
  { key: 'needsProjector', label: 'Projector' },
  { key: 'needsComputerLab', label: 'Computer Laboratory' },
  { key: 'needsSoundSystem', label: 'Sound System' },
  { key: 'needsMicrophone', label: 'Microphone' },
  { key: 'needsOther', label: 'Other' },
];

function RequisitionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    needsBus: false,
    needsFood: false,
    needsWater: false,
    needsProjector: false,
    needsComputerLab: false,
    needsSoundSystem: false,
    needsMicrophone: false,
    needsOther: false,
    otherDescription: '',
    requirementsDescription: '',
    estimatedStudents: '',
    departureTime: '',
    returnTime: '',
    specialNotes: '',
  });

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(`/api/requisition?bookingId=${bookingId}`);
        const data = await res.json();
        if (data.requisition) {
          const r = data.requisition;
          setForm({
            needsBus: r.needs_bus,
            needsFood: r.needs_food,
            needsWater: r.needs_water,
            needsProjector: r.needs_projector,
            needsComputerLab: r.needs_computer_lab,
            needsSoundSystem: r.needs_sound_system,
            needsMicrophone: r.needs_microphone,
            needsOther: r.needs_other,
            otherDescription: r.other_description || '',
            requirementsDescription: r.requirements_description || '',
            estimatedStudents: r.estimated_students || '',
            departureTime: r.departure_time || '',
            returnTime: r.return_time || '',
            specialNotes: r.special_notes || '',
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load the requisition form.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  function toggle(key) {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  }

  async function save(submit) {
    setSaving(true);
    try {
      const res = await fetch('/api/requisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, ...form, submit }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not save the requisition.');
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
    const ok = await save(false);
    if (ok) toast.success('Draft saved.');
  }

  async function handleContinue() {
    if (!form.requirementsDescription) {
      toast.error('Describe your requirements before continuing.');
      return;
    }
    const ok = await save(true);
    if (ok) {
      toast.success('Requisition submitted for approval.');
      router.push('/patron/my-bookings');
    }
  }

  if (!bookingId) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">
          A requisition is tied to a specific function. Start from{' '}
          <span className="font-medium text-ink">Book Resources</span>.
        </p>
        <Button className="mt-4" onClick={() => router.push('/patron/book-resource')}>
          Go to Book Resources
        </Button>
      </Card>
    );
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading requisition form…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuClipboardList className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Requisition Form</h1>
          <p className="text-sm text-ink-muted">Tell the office exactly what your function needs.</p>
        </div>
      </div>

      <Card className="space-y-6">
        <div>
          <p className="label">Resources Needed</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RESOURCE_CHECKS.map(({ key, label }) => (
              <Checkbox key={key} id={key} label={label} checked={form[key]} onChange={() => toggle(key)} />
            ))}
          </div>
        </div>

        {form.needsOther && (
          <Input
            label="Describe 'Other'"
            value={form.otherDescription}
            onChange={(e) => setForm({ ...form, otherDescription: e.target.value })}
          />
        )}

        <Textarea
          label="Describe Requirements"
          rows={5}
          value={form.requirementsDescription}
          onChange={(e) => setForm({ ...form, requirementsDescription: e.target.value })}
        />

        <Input
          type="number"
          min="1"
          label="Estimated Number of Students"
          value={form.estimatedStudents}
          onChange={(e) => setForm({ ...form, estimatedStudents: e.target.value })}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            type="time"
            label="Departure Time"
            value={form.departureTime}
            onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
          />
          <Input
            type="time"
            label="Return Time"
            value={form.returnTime}
            onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
          />
        </div>

        <Textarea
          label="Special Notes"
          value={form.specialNotes}
          onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
        />
      </Card>

      <Card className="my-5">
        <div className="mb-3 flex items-center gap-2">
          <LuPenLine className="h-4 w-4 text-navy-600" />
          <p className="text-sm font-semibold text-ink">Student Welfare Head Signature</p>
        </div>
        <div className="max-w-xs rounded-lg border border-dashed border-border p-4 text-center">
          <div className="mb-3 h-14 rounded-md bg-surface-muted" />
          <p className="text-xs font-medium text-ink">Head of Student Welfare</p>
          <p className="text-xs text-ink-faint">Date: —</p>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="sm:w-auto" loading={saving} onClick={handleSaveDraft}>
          Save
        </Button>
        <Button className="sm:w-auto" loading={saving} onClick={handleContinue} >
          Continue
        </Button>
      </div>
    </div>
  );
}


export default function RequisitionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <RequisitionContent />
    </Suspense>
  );
}

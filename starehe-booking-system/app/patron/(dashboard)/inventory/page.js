'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuBoxes, LuProjector, LuBus, LuMonitor, LuCircleCheck } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

const TYPE_META = {
  projector: { label: 'Projectors', icon: LuProjector },
  bus: { label: 'School Buses', icon: LuBus },
  computer_lab: { label: 'Computer Laboratories', icon: LuMonitor },
};

const STATUS_STYLES = {
  available: 'bg-green-50 text-status-approved',
  booked: 'bg-amber-50 text-status-pending',
  in_use: 'bg-navy-50 text-navy-600',
  returned: 'bg-surface-muted text-ink-faint',
  maintenance: 'bg-red-50 text-status-rejected',
};

function ReturnForm({ booking, onReturned }) {
  const [condition, setCondition] = useState('good');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, condition, comments }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not record the return.');
        return;
      }
      toast.success('Marked as returned.');
      onReturned(booking.id);
    } catch (err) {
      console.error(err);
      toast.error('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{booking.resources?.identifier}</p>
          <p className="text-xs text-ink-faint font-mono">{booking.booking_number}</p>
        </div>
        <p className="text-xs text-ink-muted">Issued {booking.resources?.issue_date}</p>
      </div>

      <Select label="Condition on return" value={condition} onChange={(e) => setCondition(e.target.value)}>
        <option value="good">Good</option>
        <option value="fair">Fair — minor wear</option>
        <option value="damaged">Damaged — needs maintenance</option>
      </Select>

      <Textarea
        label="Comments"
        placeholder="Optional notes about the condition"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={2}
      />

      <Button className="w-full sm:w-auto" icon={LuCircleCheck} loading={submitting} onClick={submit}>
        Mark as Returned
      </Button>
    </Card>
  );
}

export default function InventoryPage() {
  const [resources, setResources] = useState([]);
  const [heldBookings, setHeldBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [resRes, mineRes] = await Promise.all([fetch('/api/inventory'), fetch('/api/inventory/mine')]);
      const resData = await resRes.json();
      const mineData = await mineRes.json();
      setResources(resData.resources || []);
      setHeldBookings(mineData.heldBookings || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load inventory.');
    } finally {
      setLoading(false);
    }
  }

  function handleReturned(bookingId) {
    setHeldBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }

  const grouped = resources.reduce((acc, r) => {
    acc[r.resource_type] = acc[r.resource_type] || [];
    acc[r.resource_type].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuBoxes className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Inventory</h1>
          <p className="text-sm text-ink-muted">Resource availability across the school, and anything you&apos;re holding.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          {heldBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-ink">Return a Resource</h2>
              <div className="space-y-3">
                {heldBookings.map((b) => (
                  <ReturnForm key={b.id} booking={b} onReturned={handleReturned} />
                ))}
              </div>
            </div>
          )}

          {Object.entries(TYPE_META).map(([type, meta]) => {
            const items = grouped[type] || [];
            const Icon = meta.icon;
            return (
              <div key={type} className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-navy-600" />
                  <h2 className="text-sm font-semibold text-ink">{meta.label}</h2>
                  <span className="text-xs text-ink-faint">
                    ({items.filter((i) => i.status === 'available').length} available of {items.length})
                  </span>
                </div>
                {items.length === 0 ? (
                  <Card><p className="py-4 text-center text-sm text-ink-faint">None registered yet.</p></Card>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((r) => (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">{r.identifier}</p>
                          <span className={`badge ${STATUS_STYLES[r.status]}`}>{r.status.replace('_', ' ')}</span>
                        </div>
                        <p className="mt-1 text-xs text-ink-faint">{r.location || '—'}</p>
                        {r.current_holder && (
                          <p className="mt-2 text-xs text-ink-muted">Held by: {r.current_holder}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
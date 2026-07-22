'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuUndo2, LuCircleCheck, LuWrench } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ApproveReturnsPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/returns');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load returns.');
        return;
      }
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function clearMaintenance(id) {
    setClearing(id);
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not clear this resource.');
        return;
      }
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success('Resource cleared and back in the available pool.');
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setClearing(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuUndo2 className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Approve Returns</h1>
          <p className="text-sm text-ink-muted">
            Resources returned in poor condition, flagged for maintenance and awaiting clearance.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : resources.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-ink-faint">Nothing needs your attention right now.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-status-rejected">
                  <LuWrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{r.identifier}</p>
                  <p className="text-xs text-ink-faint">
                    Returned {r.returned_date || '—'} · Condition: {r.condition || 'damaged'}
                  </p>
                  {r.latestReturn?.comments && (
                    <p className="mt-1 text-xs text-ink-muted">&quot;{r.latestReturn.comments}&quot;</p>
                  )}
                </div>
              </div>
              <Button icon={LuCircleCheck} loading={clearing === r.id} onClick={() => clearMaintenance(r.id)}>
                Clear & Return to Service
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
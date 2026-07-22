'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuBoxes, LuPlus, LuTrash2 } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const TYPE_LABELS = { projector: 'Projector', bus: 'Bus', computer_lab: 'Computer Lab' };
const STATUS_OPTIONS = ['available', 'booked', 'in_use', 'returned', 'maintenance'];

export default function ManageResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ resourceType: 'projector', identifier: '', location: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resources');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load resources.');
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

  async function createResource(e) {
    e.preventDefault();
    if (!form.identifier.trim()) {
      toast.error('Enter an identifier, e.g. "Projector-04".');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not create the resource.');
        return;
      }
      setResources((prev) => [...prev, data.resource]);
      setForm({ resourceType: form.resourceType, identifier: '', location: '' });
      toast.success('Resource added.');
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id, status) {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await fetch(`/api/admin/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('Could not update status.');
      load();
    }
  }

  async function deleteResource(id) {
    if (!confirm('Remove this resource permanently?')) return;
    const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not delete the resource.');
      return;
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success('Resource removed.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuBoxes className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Manage Resources</h1>
          <p className="text-sm text-ink-muted">Add and update projectors, buses, and computer laboratories.</p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Add a Resource</h2>
        <form onSubmit={createResource} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
          <Select
            label="Type"
            value={form.resourceType}
            onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
          >
            <option value="projector">Projector</option>
            <option value="bus">Bus</option>
            <option value="computer_lab">Computer Lab</option>
          </Select>
          <Input
            label="Identifier"
            placeholder="e.g. Projector-04"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
          />
          <Input
            label="Location"
            placeholder="e.g. AV Store"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <Button type="submit" icon={LuPlus} loading={creating}>
            Add
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Holder</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-ink">{r.identifier}</td>
                  <td className="px-4 py-3 text-ink-muted">{TYPE_LABELS[r.resource_type]}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.location || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{r.current_holder || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteResource(r.id)} className="text-ink-faint hover:text-status-rejected">
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">No resources yet — add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
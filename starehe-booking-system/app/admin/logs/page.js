'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuScrollText } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'issued', label: 'Issued' },
  { value: 'returned', label: 'Returned' },
  { value: 'maintenance_flagged', label: 'Maintenance Flagged' },
  { value: 'maintenance_cleared', label: 'Maintenance Cleared' },
];

const ACTION_STYLES = {
  issued: 'bg-navy-50 text-navy-600',
  returned: 'bg-green-50 text-status-approved',
  maintenance_flagged: 'bg-red-50 text-status-rejected',
  maintenance_cleared: 'bg-amber-50 text-status-pending',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ViewLogsPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?action=${action}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load logs.');
        return;
      }
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LuScrollText className="h-5 w-5 text-navy-600" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Inventory Logs</h1>
            <p className="text-sm text-ink-muted">Every issue, return, and maintenance event, most recent first.</p>
          </div>
        </div>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="sm:w-56">
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium text-ink">{log.resources?.identifier || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ACTION_STYLES[log.action] || 'bg-surface-muted text-ink-faint'}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{log.users?.full_name || log.users?.email || 'System'}</td>
                  <td className="px-4 py-3 text-ink-muted">{log.notes || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-faint">{formatDate(log.created_at)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">No log entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
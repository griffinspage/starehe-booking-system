'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuShieldCheck } from 'react-icons/lu';
import Card from '@/components/ui/Card';

export default function ManageClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clubs');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load clubs.');
        return;
      }
      setClubs(data.clubs || []);
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuShieldCheck className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Manage Clubs</h1>
          <p className="text-sm text-ink-muted">Every registered club and how active they are.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Patron</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Total Bookings</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clubs.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-ink">{c.clubName}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.patronName || '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    <div>{c.email}</div>
                    <div className="text-xs text-ink-faint">{c.phoneNumber || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{c.totalBookings}</td>
                  <td className="px-4 py-3 text-status-approved">{c.approvedBookings}</td>
                  <td className="px-4 py-3 text-status-pending">{c.pendingBookings}</td>
                </tr>
              ))}
              {clubs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">No clubs registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
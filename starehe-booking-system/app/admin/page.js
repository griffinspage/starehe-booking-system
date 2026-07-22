'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuUsers,
  LuShieldCheck,
  LuClipboardList,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuBoxes,
  LuWrench,
} from 'react-icons/lu';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load stats.');
        return;
      }
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Network error loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (!stats) return <p className="text-sm text-ink-muted">No data available.</p>;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-ink">Admin Overview</h1>
        <p className="mt-1 text-sm text-ink-muted">School-wide bookings, resources, and users at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={LuUsers} />
        <StatCard label="Registered Clubs" value={stats.totalClubs} icon={LuShieldCheck} />
        <StatCard label="Total Bookings" value={stats.bookingCounts.total} icon={LuClipboardList} />
        <StatCard label="Pending Approval" value={stats.bookingCounts.pending} icon={LuClock} tone="pending" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved Functions" value={stats.bookingCounts.approved} icon={LuCircleCheck} tone="approved" />
        <StatCard label="Rejected Functions" value={stats.bookingCounts.rejected} icon={LuCircleX} tone="rejected" />
        <StatCard label="Available Resources" value={stats.resourceCounts.available} icon={LuBoxes} />
        <StatCard label="Needs Maintenance" value={stats.resourceCounts.maintenance} icon={LuWrench} tone="rejected" />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Resource Fleet</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-ink">{stats.resourceCounts.total}</p>
            <p className="text-xs text-ink-muted">Total</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-status-approved">{stats.resourceCounts.available}</p>
            <p className="text-xs text-ink-muted">Available</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-status-pending">{stats.resourceCounts.booked}</p>
            <p className="text-xs text-ink-muted">In Use / Booked</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
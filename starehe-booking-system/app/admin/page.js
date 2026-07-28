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
  LuLayoutDashboard,
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

  if (loading) return <p className="text-sm text-ink-muted p-8">Loading overview stats...</p>;
  if (!stats) return <p className="text-sm text-ink-muted p-8">No statistical data available.</p>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 border border-navy-100">
            <LuLayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Admin System Overview</h1>
            <p className="text-xs text-ink-muted">School-wide bookings, inventory fleet, and user statistics at a glance.</p>
          </div>
        </div>
      </div>

      {/* Row 1: Users & Bookings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Registered Users" value={stats.totalUsers} icon={LuUsers} tone="default" />
        <StatCard label="Registered Clubs" value={stats.totalClubs} icon={LuShieldCheck} tone="default" />
        <StatCard label="Total Bookings Submitted" value={stats.bookingCounts.total} icon={LuClipboardList} tone="default" />
        <StatCard label="Pending Approval Queue" value={stats.bookingCounts.pending} icon={LuClock} tone="pending" />
      </div>

      {/* Row 2: Statuses & Inventory */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved Functions" value={stats.bookingCounts.approved} icon={LuCircleCheck} tone="approved" />
        <StatCard label="Rejected Functions" value={stats.bookingCounts.rejected} icon={LuCircleX} tone="rejected" />
        <StatCard label="Available Resources" value={stats.resourceCounts.available} icon={LuBoxes} tone="approved" />
        <StatCard label="Under Maintenance" value={stats.resourceCounts.maintenance} icon={LuWrench} tone="rejected" />
      </div>

      {/* Resource Fleet Breakdown */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3">
          <h2 className="font-display text-base font-bold text-navy-900 flex items-center gap-2">
            <LuBoxes className="h-4 w-4 text-navy-600" />
            Resource Fleet Status Summary
          </h2>
          <span className="text-xs font-semibold text-ink-faint">Live Inventory Breakdown</span>
        </div>

        <div className="grid grid-cols-1 gap-4 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 text-center pt-2">
          <div className="pt-2 sm:pt-0">
            <p className="text-3xl font-extrabold text-navy-900 tracking-tight">{stats.resourceCounts.total}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted uppercase tracking-wider">Total Inventory Fleet</p>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{stats.resourceCounts.available}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted uppercase tracking-wider">Ready for Booking</p>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <p className="text-3xl font-extrabold text-amber-600 tracking-tight">{stats.resourceCounts.booked}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted uppercase tracking-wider">Currently In Use / Reserved</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
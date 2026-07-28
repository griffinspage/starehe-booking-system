import {
  LuClipboardList,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuProjector,
  LuBus,
  LuMonitor,
  LuCalendarDays,
  LuSparkles,
} from 'react-icons/lu';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('users').select('*').eq('id', user?.id).single();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('club_patron_id', user?.id)
    .order('created_at', { ascending: false });

  const { data: resources } = await supabase.from('resources').select('resource_type, status');

  const counts = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === 'pending').length || 0,
    approved: bookings?.filter((b) => b.status === 'approved').length || 0,
    rejected: bookings?.filter((b) => b.status === 'rejected').length || 0,
  };

  const availability = {
    projector: resources?.filter((r) => r.resource_type === 'projector' && r.status === 'available').length || 0,
    bus: resources?.filter((r) => r.resource_type === 'bus' && r.status === 'available').length || 0,
    computer_lab: resources?.filter((r) => r.resource_type === 'computer_lab' && r.status === 'available').length || 0,
  };

  const upcoming = (bookings || [])
    .filter((b) => b.status === 'approved' && new Date(b.booking_date) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-gold-500/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <LuSparkles className="h-4 w-4" /> Club Patron Dashboard
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Welcome back{profile?.club_name ? `, ${profile.club_name}` : ''}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Overview of your club&apos;s function requisitions, resource availability, and approval status.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Bookings" value={counts.total} icon={LuClipboardList} tone="default" />
        <StatCard label="Pending Approval" value={counts.pending} icon={LuClock} tone="pending" />
        <StatCard label="Approved Functions" value={counts.approved} icon={LuCircleCheck} tone="approved" />
        <StatCard label="Rejected Functions" value={counts.rejected} icon={LuCircleX} tone="rejected" />
      </div>

      {/* Resource Fleet Availability */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Live Fleet Availability</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Available Projectors" value={availability.projector} icon={LuProjector} tone="default" />
          <StatCard label="Available Buses" value={availability.bus} icon={LuBus} tone="default" />
          <StatCard label="Available Computer Labs" value={availability.computer_lab} icon={LuMonitor} tone="default" />
        </div>
      </div>

      {/* Upcoming Events */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <LuCalendarDays className="h-4 w-4 text-navy-600" />
            <h2 className="font-display text-base font-bold text-navy-900">Upcoming Approved Functions</h2>
          </div>
          <span className="text-xs text-ink-faint">Next 5 Scheduled Events</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-faint">
            No upcoming approved events scheduled yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3.5 hover:bg-surface-muted/60 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{b.function_name || 'Booking'}</p>
                  <p className="text-xs text-ink-faint mt-0.5 font-mono">
                    {b.booking_date} · {b.venue || 'Venue TBD'} · #{b.booking_number}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import {
  LuClipboardList,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuProjector,
  LuBus,
  LuMonitor,
  LuCalendarDays,
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
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome back{profile?.club_name ? `, ${profile.club_name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s what&apos;s happening with your club&apos;s bookings.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Bookings" value={counts.total} icon={LuClipboardList} />
        <StatCard label="Pending Approval" value={counts.pending} icon={LuClock} tone="pending" />
        <StatCard label="Approved Functions" value={counts.approved} icon={LuCircleCheck} tone="approved" />
        <StatCard label="Rejected Functions" value={counts.rejected} icon={LuCircleX} tone="rejected" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Available Projectors" value={availability.projector} icon={LuProjector} />
        <StatCard label="Available Buses" value={availability.bus} icon={LuBus} />
        <StatCard label="Available Laboratories" value={availability.computer_lab} icon={LuMonitor} />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <LuCalendarDays className="h-4 w-4 text-navy-600" />
          <h2 className="text-sm font-semibold text-ink">Upcoming Events</h2>
        </div>

        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">No upcoming approved events yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{b.function_name || 'Booking'}</p>
                  <p className="text-xs text-ink-faint">
                    {b.booking_date} · {b.venue || '—'} · {b.booking_number}
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

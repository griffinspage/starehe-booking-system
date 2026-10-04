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
  LuFileText,
  LuMail,
  LuCheck,
  LuX,
} from 'react-icons/lu';

import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import DownloadApprovedPdf from '@/components/dashboard/DownloadApprovedPdf';

const APPROVAL_STAGES = [
  { role: 'sm1', label: 'SM1' },
  { role: 'sm2', label: 'SM2' },
  { role: 'sm3', label: 'SM3' },
  { role: 'sm4', label: 'SM4' },
  { role: 'welfare_head', label: 'Student Welfare' },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // --------------------------------------------------
  // Profile
  // --------------------------------------------------
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // --------------------------------------------------
  // Bookings
  // --------------------------------------------------
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('club_patron_id', user.id)
    .order('created_at', { ascending: false });

  const bookingRows = bookings || [];

  // --------------------------------------------------
  // Approvals
  // --------------------------------------------------
  const bookingIds = bookingRows.map((booking) => booking.id);

  let approvals = [];

  if (bookingIds.length > 0) {
    const { data: approvalRows } = await supabase
      .from('approvals')
      .select(
        `
          id,
          booking_id,
          approver_role,
          sequence_order,
          decision,
          signature_id,
          decided_at
        `
      )
      .in('booking_id', bookingIds)
      .order('sequence_order', { ascending: true });

    approvals = approvalRows || [];
  }

  // --------------------------------------------------
  // Email records
  // --------------------------------------------------
  let emailRows = [];

  if (bookingIds.length > 0) {
    const { data: emails } = await supabase
      .from('emails')
      .select(
        `
          id,
          booking_id,
          recipient_email,
          subject,
          status,
          created_at
        `
      )
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    emailRows = emails || [];
  }

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------
  const counts = {
    total: bookingRows.length,
    pending: bookingRows.filter(
      (b) => b.status === 'pending'
    ).length,
    approved: bookingRows.filter(
      (b) => b.status === 'approved'
    ).length,
    rejected: bookingRows.filter(
      (b) => b.status === 'rejected'
    ).length,
  };

  // --------------------------------------------------
  // Resource availability
  // --------------------------------------------------
  const { data: resources } = await supabase
    .from('resources')
    .select('resource_type, status');

  const availability = {
    projector:
      resources?.filter(
        (r) =>
          r.resource_type === 'projector' &&
          r.status === 'available'
      ).length || 0,

    bus:
      resources?.filter(
        (r) =>
          r.resource_type === 'bus' &&
          r.status === 'available'
      ).length || 0,

    computer_lab:
      resources?.filter(
        (r) =>
          r.resource_type === 'computer_lab' &&
          r.status === 'available'
      ).length || 0,
  };

  // --------------------------------------------------
  // Upcoming approved functions
  // --------------------------------------------------
  const upcoming = bookingRows
    .filter(
      (b) =>
        b.status === 'approved' &&
        new Date(b.booking_date) >= new Date()
    )
    .slice(0, 5);

  // --------------------------------------------------
  // Most recent approved booking
  // --------------------------------------------------
  const latestApprovedBooking = bookingRows.find(
    (booking) => booking.status === 'approved'
  );

  const latestApprovedApprovals = latestApprovedBooking
    ? approvals.filter(
        (approval) =>
          approval.booking_id === latestApprovedBooking.id
      )
    : [];

  const latestApprovedEmail = latestApprovedBooking
    ? emailRows.find(
        (email) =>
          email.booking_id === latestApprovedBooking.id &&
          email.status === 'sent'
      )
    : null;

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------ */}
      {/* Welcome Banner */}
      {/* ------------------------------------------------ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 p-6 text-white shadow-md">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-gold-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-400">
              <LuSparkles className="h-4 w-4" />
              Club Patron Dashboard
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Welcome back
              {profile?.club_name
                ? `, ${profile.club_name}`
                : ''}
            </h1>

            <p className="mt-1 text-xs text-slate-300">
              Overview of your club&apos;s function
              requisitions, resource availability, and
              approval status.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* Statistics */}
      {/* ------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={counts.total}
          icon={LuClipboardList}
          tone="default"
        />

        <StatCard
          label="Pending Approval"
          value={counts.pending}
          icon={LuClock}
          tone="pending"
        />

        <StatCard
          label="Approved Functions"
          value={counts.approved}
          icon={LuCircleCheck}
          tone="approved"
        />

        <StatCard
          label="Rejected Functions"
          value={counts.rejected}
          icon={LuCircleX}
          tone="rejected"
        />
      </div>

      {/* ------------------------------------------------ */}
      {/* Resource Fleet */}
      {/* ------------------------------------------------ */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Live Fleet Availability
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Available Projectors"
            value={availability.projector}
            icon={LuProjector}
            tone="default"
          />

          <StatCard
            label="Available Buses"
            value={availability.bus}
            icon={LuBus}
            tone="default"
          />

          <StatCard
            label="Available Computer Labs"
            value={availability.computer_lab}
            icon={LuMonitor}
            tone="default"
          />
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* Latest Approved Function */}
      {/* ------------------------------------------------ */}
      {latestApprovedBooking && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/80 bg-surface-muted/40 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <LuCircleCheck className="h-5 w-5 text-green-600" />

                  <h2 className="font-display text-base font-bold text-navy-900">
                    Function Approved
                  </h2>
                </div>

                <p className="text-sm font-semibold text-navy-800">
                  {latestApprovedBooking.function_name ||
                    'Approved Function'}
                </p>

                <p className="mt-1 text-xs text-ink-faint">
                  Booking #
                  {latestApprovedBooking.booking_number}
                </p>
              </div>

              <StatusBadge status="approved" />
            </div>
          </div>

          <div className="p-5">

            {/* Approval chain */}
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Approval Progress
              </h3>

              <div className="space-y-3">
                {APPROVAL_STAGES.map((stage) => {
                  const approval =
                    latestApprovedApprovals.find(
                      (item) =>
                        item.approver_role === stage.role
                    );

                  const approved =
                    approval?.decision === 'approved';

                  const rejected =
                    approval?.decision === 'rejected';

                  const signed =
                    Boolean(approval?.signature_id);

                  return (
                    <div
                      key={stage.role}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            approved
                              ? 'bg-green-100 text-green-700'
                              : rejected
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {approved ? (
                            <LuCheck className="h-4 w-4" />
                          ) : rejected ? (
                            <LuX className="h-4 w-4" />
                          ) : (
                            <LuClock className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-navy-900">
                            {stage.label}
                          </p>

                          <p className="text-xs text-ink-faint">
                            {approved
                              ? signed
                                ? 'Approved and signed'
                                : 'Approved'
                              : rejected
                              ? 'Rejected'
                              : 'Pending'}
                          </p>
                        </div>
                      </div>

                      {approved && signed && (
                        <span className="text-[11px] font-semibold text-green-700">
                          SIGNED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PDF + email */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* PDF */}
              <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-navy-100 p-2 text-navy-700">
                    <LuFileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-900">
                      Approved Documents
                    </p>

                    {latestApprovedBooking.pdf_path ? (
                      <>
                        <p className="mt-1 text-xs text-green-700">
                          Final signed PDF is available.
                        </p>

                        <DownloadApprovedPdf
                          bookingId={latestApprovedBooking.id}
                        />
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-amber-600">
                        PDF is still being prepared.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-100 p-2 text-green-700">
                    <LuMail className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      Approval Email
                    </p>

                    {latestApprovedEmail ? (
                      <>
                        <p className="mt-1 text-xs text-green-700">
                          Sent successfully to{' '}
                          {latestApprovedEmail.recipient_email}.
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-amber-600">
                        Email is being processed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ */}
      {/* Upcoming Events */}
      {/* ------------------------------------------------ */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <LuCalendarDays className="h-4 w-4 text-navy-600" />

            <h2 className="font-display text-base font-bold text-navy-900">
              Upcoming Approved Functions
            </h2>
          </div>

          <span className="text-xs text-ink-faint">
            Next 5 Scheduled Events
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-faint">
            No upcoming approved events scheduled yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-muted/60"
              >
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {b.function_name || 'Booking'}
                  </p>

                  <p className="mt-0.5 text-xs font-mono text-ink-faint">
                    {b.booking_date} ·{' '}
                    {b.venue || 'Venue TBD'} · #
                    {b.booking_number}
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
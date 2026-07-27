'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LuListChecks, LuSearch, LuDownload } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Select from '@/components/ui/Select';
import WhatsAppShareButton from '@/components/dashboard/WhatsAppShareButton';
import { createClient } from '@/lib/supabase/client';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'date_asc', label: 'Function date ↑' },
  { value: 'date_desc', label: 'Function date ↓' },
];

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (q) params.set('q', q);
      const res = await fetch(`/api/bookings/mine?${params.toString()}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    const list = [...bookings];
    switch (sort) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'date_asc':
        return list.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
      case 'date_desc':
        return list.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));
      default:
        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [bookings, sort]);

  async function downloadPdf(booking) {
    if (!booking.pdf_path) {
      toast.error('PDF not generated yet — it appears once the Welfare Head approves.');
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(booking.pdf_path, 60);
    if (error || !data) {
      toast.error('Could not fetch the PDF link.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function getPdfUrl(booking) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('documents').createSignedUrl(booking.pdf_path, 300);
    return data?.signedUrl;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuListChecks className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Bookings</h1>
          <p className="text-sm text-ink-muted">Every function you&apos;ve booked, and where it stands.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by club, booking number, or resource"
            className="input-field pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-44">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : sorted.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-ink-faint">No bookings match your filters yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/patron/master-list?bookingId=${b.id}`}
                    className="text-sm font-semibold text-ink hover:text-navy-600"
                  >
                    {b.function_name || 'Booking'}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-ink-faint">{b.booking_number}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {b.booking_date} · {b.venue || '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={b.status} />
                  {b.status === 'approved' && b.pdf_path && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadPdf(b)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
                      >
                        <LuDownload className="h-3.5 w-3.5" /> PDF
                      </button>
                      <ShareButtonAsync booking={b} getPdfUrl={getPdfUrl} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareButtonAsync({ booking, getPdfUrl }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    getPdfUrl(booking).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id]);

  if (!url) return null;
  return <WhatsAppShareButton functionName={booking.function_name} pdfUrl={url} />;
}
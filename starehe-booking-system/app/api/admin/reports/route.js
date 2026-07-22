// app/api/admin/reports/route.js
// GET ?range=daily|weekly|monthly|yearly — aggregated data for the reports
// charts: booking status breakdown, bookings over time, resource type usage.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401 };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.', status: 403 };

  return { user };
}

const RANGE_DAYS = { daily: 14, weekly: 12 * 7, monthly: 365, yearly: 365 * 3 };

export async function GET(request) {
  const supabase = createClient();
  const check = await requireAdmin(supabase);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const range = request.nextUrl.searchParams.get('range') || 'monthly';
  const days = RANGE_DAYS[range] || RANGE_DAYS.monthly;

  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: bookings } = await admin
    .from('bookings')
    .select('status, booking_type, resource_type, created_at')
    .gte('created_at', since.toISOString());

  // 1. Status breakdown (for a pie chart)
  const statusBreakdown = ['pending', 'approved', 'rejected', 'completed', 'cancelled'].map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: (bookings || []).filter((b) => b.status === status).length,
  }));

  // 2. Bookings over time, bucketed by day/week/month depending on range (for a bar/line chart)
  const bucketKey = (dateStr) => {
    const d = new Date(dateStr);
    if (range === 'daily') return d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (range === 'weekly') {
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return monday.toISOString().slice(0, 10);
    }
    if (range === 'yearly') return String(d.getFullYear());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // monthly
  };

  const buckets = {};
  for (const b of bookings || []) {
    const key = bucketKey(b.created_at);
    buckets[key] = (buckets[key] || 0) + 1;
  }
  const bookingsOverTime = Object.entries(buckets)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, count]) => ({ period, count }));

  // 3. Resource type usage (for a bar chart)
  const resourceUsage = ['projector', 'bus', 'computer_lab'].map((type) => ({
    name: type === 'computer_lab' ? 'Computer Lab' : type.charAt(0).toUpperCase() + type.slice(1),
    value: (bookings || []).filter((b) => b.resource_type === type).length,
  }));

  return NextResponse.json({ statusBreakdown, bookingsOverTime, resourceUsage, range });
}
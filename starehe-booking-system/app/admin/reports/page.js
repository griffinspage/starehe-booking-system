'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LuChartColumn } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

const STATUS_COLORS = ['#b8860b', '#1a7a4c', '#b3261e', '#1f3a63', '#8b93a0'];
const RANGE_OPTIONS = [
  { value: 'daily', label: 'Last 14 Days' },
  { value: 'weekly', label: 'Last 12 Weeks' },
  { value: 'monthly', label: 'Last 12 Months' },
  { value: 'yearly', label: 'Last 3 Years' },
];

export default function ReportsPage() {
  const [range, setRange] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Could not load reports.');
        return;
      }
      setData(json);
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
          <LuChartColumn className="h-5 w-5 text-navy-600" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
            <p className="text-sm text-ink-muted">Booking activity and resource usage over time.</p>
          </div>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="sm:w-52">
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>

      {loading || !data ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-ink">Bookings by Status</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.statusBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.statusBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-ink">Resource Usage</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.resourceUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f3a63" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-ink">Bookings Over Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.bookingsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1f3a63" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
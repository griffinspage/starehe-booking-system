'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuBellRing,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuCalendarDays,
  LuMail,
  LuCheckCheck,
} from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const TYPE_META = {
  booking_approved: { icon: LuCircleCheck, tone: 'text-status-approved bg-green-50' },
  booking_rejected: { icon: LuCircleX, tone: 'text-status-rejected bg-red-50' },
  pending_approval: { icon: LuClock, tone: 'text-status-pending bg-amber-50' },
  upcoming_event: { icon: LuCalendarDays, tone: 'text-navy-600 bg-navy-50' },
  resource_returned: { icon: LuCircleCheck, tone: 'text-status-approved bg-green-50' },
  email_sent: { icon: LuMail, tone: 'text-navy-600 bg-navy-50' },
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
      toast.error('Could not mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LuBellRing className="h-5 w-5 text-navy-600" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
            <p className="text-sm text-ink-muted">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" icon={LuCheckCheck} loading={markingAll} onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-ink-faint">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.upcoming_event;
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex w-full items-start gap-3 rounded-card border p-4 text-left transition-colors ${
                  n.is_read ? 'border-border bg-white' : 'border-navy-200 bg-navy-50/40'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${n.is_read ? 'text-ink-muted' : 'font-medium text-ink'}`}>{n.message}</p>
                  <p className="mt-1 text-xs text-ink-faint">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
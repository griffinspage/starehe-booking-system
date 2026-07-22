'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LuLayoutDashboard,
  LuUsers,
  LuShieldCheck,
  LuBoxes,
  LuChartColumn,
  LuUndo2,
  LuScrollText,
  LuLogOut,
  LuMenu,
  LuX,
  LuSchool,
} from 'react-icons/lu';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LuLayoutDashboard },
  { href: '/admin/users', label: 'Manage Users', icon: LuUsers },
  { href: '/admin/clubs', label: 'Manage Clubs', icon: LuShieldCheck },
  { href: '/admin/resources', label: 'Manage Resources', icon: LuBoxes },
  { href: '/admin/reports', label: 'Reports', icon: LuChartColumn },
  { href: '/admin/returns', label: 'Approve Returns', icon: LuUndo2 },
  { href: '/admin/logs', label: 'View Logs', icon: LuScrollText },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/patron/login');
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <span className="font-display text-base font-semibold text-navy-700">SBMS Admin</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-surface-muted">
          <LuMenu className="h-5 w-5" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-navy-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-500 text-white">
              <LuSchool className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-navy-700 leading-tight">Starehe SBMS</p>
              <p className="text-xs text-ink-faint">Admin</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 hover:bg-surface-muted lg:hidden">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-navy-50 text-navy-600' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-status-rejected hover:bg-red-50"
          >
            <LuLogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
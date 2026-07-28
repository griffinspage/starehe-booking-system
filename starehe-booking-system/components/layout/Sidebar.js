'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LuLayoutDashboard,
  LuCalendarPlus,
  LuTable,
  LuClipboardList,
  LuListChecks,
  LuBellRing,
  LuBoxes,
  LuUserRound,
  LuLogOut,
  LuMenu,
  LuX,
  LuShieldCheck,
} from 'react-icons/lu';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/patron/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
  { href: '/patron/book-resource', label: 'Book Resources', icon: LuCalendarPlus },
  { href: '/patron/master-list', label: 'Master List', icon: LuTable },
  { href: '/patron/requisition', label: 'Requisition Form', icon: LuClipboardList },
  { href: '/patron/my-bookings', label: 'My Bookings', icon: LuListChecks },
  { href: '/patron/notifications', label: 'Notifications', icon: LuBellRing },
  { href: '/patron/inventory', label: 'Inventory', icon: LuBoxes },
  { href: '/patron/profile', label: 'Profile', icon: LuUserRound },
];

export default function Sidebar() {
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
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-navy-800 bg-navy-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gold-500/20 text-gold-400">
            <LuShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-wide text-white">Starehe SBMS</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-300 hover:bg-navy-800 hover:text-white"
        >
          <LuMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-navy-800 bg-navy-900 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-navy-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-md">
              <LuShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white tracking-wide leading-tight">
                Starehe SBMS
              </p>
              <p className="text-[11px] font-medium tracking-wider text-gold-400 uppercase">
                Club Patron Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150',
                  active
                    ? 'bg-navy-800/90 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-navy-800/50 hover:text-slate-200'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gold-400" />
                )}
                <Icon
                  className={clsx(
                    'h-[18px] w-[18px] transition-colors',
                    active ? 'text-gold-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User / Footer */}
        <div className="border-t border-navy-800/80 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LuLogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

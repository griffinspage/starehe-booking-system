'use client';

import { useRouter } from 'next/navigation';
import { LuSchool, LuLogOut, LuClipboardCheck } from 'react-icons/lu';
import { createClient } from '@/lib/supabase/client';

export default function ApprovalTopBar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/patron/login');
  }

  return (
    <header className="border-b border-navy-800 bg-navy-900 px-6 py-4 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-md">
            <LuSchool className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold tracking-wide text-white">
                Starehe SBMS
              </span>
              <span className="flex items-center gap-1 rounded bg-gold-400/10 px-2 py-0.5 text-[11px] font-semibold text-gold-400 border border-gold-400/20">
                <LuClipboardCheck className="h-3 w-3" /> Approval Portal
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-navy-800 hover:text-rose-400"
        >
          <LuLogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </header>
  );
}
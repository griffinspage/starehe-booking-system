'use client';

import { useRouter } from 'next/navigation';
import { LuSchool, LuLogOut } from 'react-icons/lu';
import { createClient } from '@/lib/supabase/client';

export default function ApprovalTopBar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/patron/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-white px-5 py-3.5 lg:px-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-500 text-white">
          <LuSchool className="h-4 w-4" />
        </div>
        <span className="font-display text-sm font-semibold text-navy-700">Starehe SBMS · Approvals</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-status-rejected"
      >
        <LuLogOut className="h-4 w-4" /> Logout
      </button>
    </header>
  );
}
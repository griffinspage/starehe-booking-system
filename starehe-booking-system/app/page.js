'use client';

import { useRouter } from 'next/navigation';
import { LuSchool, LuUsers, LuUser } from 'react-icons/lu';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-500 text-white shadow-card">
          <LuSchool className="h-7 w-7" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-navy-700 sm:text-3xl">
          Starehe Booking Management System
        </h1>
        <p className="mt-3 text-sm text-ink-muted sm:text-base">
          Book projectors, buses and computer laboratories, and route club functions through
          approval — all in one place.
        </p>

        <div className="card mt-10 p-7">
          <p className="text-sm font-medium text-ink">Are you a Club Patron?</p>
          <p className="mt-1 text-xs text-ink-faint">
            Club Patrons sign in to run full club functions with a master list and requisition.
            Teachers booking a projector or lab don&apos;t need an account.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push('/patron/login')}
              className="btn-primary flex-col !items-center gap-1.5 py-5"
            >
              <LuUsers className="h-5 w-5" />
              Yes, I&apos;m a Club Patron
            </button>
            <button
              onClick={() => router.push('/teacher-booking')}
              className="btn-secondary flex-col !items-center gap-1.5 py-5"
            >
              <LuUser className="h-5 w-5" />
              No, I&apos;m a Teacher
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-faint">Student Welfare Office · Starehe Boys&apos; Centre</p>
      </div>
    </div>
  );
}

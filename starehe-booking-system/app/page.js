'use client';

import Link from 'next/link';
import { LuSchool, LuUsers, LuUser, LuKeyRound, LuActivity, LuInfo, LuArrowRight } from 'react-icons/lu';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-900 text-white font-body selection:bg-navy-700 selection:text-white">
      {/* Decorative Glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px] sm:h-[500px] sm:w-[500px]"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-600/15 blur-[100px] sm:h-[500px] sm:w-[500px]"></div>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-navy-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy-400 to-navy-600 text-white shadow-lg ring-1 ring-white/20">
              <LuSchool className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Starehe Boys&apos; Centre</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-navy-300 font-medium">Est. 1959</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href="/patron/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-navy-100 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
            >
              <LuKeyRound className="h-3.5 w-3.5" /> Staff Login
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="mt-16 md:mt-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-500/30 px-3 py-1 text-xs font-medium text-navy-300 ring-1 ring-navy-400/20">
                <LuActivity className="h-3 w-3 animate-pulse text-cyan-400" /> Booking Management System
              </span>

              <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                Starehe Booking <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Management Portal
                </span>
              </h1>

              <p className="mt-6 text-sm leading-relaxed text-navy-200/90 sm:text-base">
                Welcome to the official booking and approval portal for Starehe Boys&apos; Centre.
                Club patrons can schedule functions, manage student master lists, and request requisitions,
                while teachers can book projectors and computer laboratories on demand.
              </p>

              {/* School Details */}
              <div className="mt-8 border-t border-navy-800/80 pt-8">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-cyan-400 ring-1 ring-white/5">
                    <LuInfo className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white">About Starehe Boys&apos; Centre</h3>
                    <p className="mt-2 text-xs leading-relaxed text-navy-300">
                      Founded in 1959 by Dr. Geoffrey William Griffin, Geoffrey Gatama Geturo, and Joseph Kamiru Gikubu,
                      Starehe began as a rescue centre for orphaned and vulnerable boys. Swahili for &quot;Tranquility&quot; or &quot;Comfort,&quot;
                      Starehe is guided by the mission: <em>&quot;To provide care and education for boys in need and inspire them to transform
                      into productive and exemplary members of society.&quot;</em>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-navy-800/80 bg-navy-800/40 p-6 backdrop-blur-md shadow-2xl">
                <h2 className="text-base font-semibold text-white">Access Portal</h2>
                <p className="mt-1 text-xs text-navy-300">Select your account type or role to continue.</p>

                <div className="mt-6 space-y-4">
                  {/* Patron Card */}
                  <div className="rounded-xl border border-navy-700/50 bg-navy-900/40 p-4 transition-all hover:border-cyan-500/30 hover:bg-navy-900/80">
                    <div className="flex gap-3 items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 ring-1 ring-cyan-500/20">
                        <LuUsers className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Club Patrons</h3>
                        <p className="mt-1 text-[11px] text-navy-400">Manage club functions, requisitions, and student lists.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/patron/login"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 py-2 text-xs font-semibold text-white transition-all hover:bg-cyan-500 active:scale-[0.98]"
                      >
                        Login <LuArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href="/patron/signup"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy-700 py-2 text-xs font-semibold text-white transition-all hover:bg-navy-600 active:scale-[0.98]"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>

                  {/* Teacher Card */}
                  <div className="rounded-xl border border-navy-700/50 bg-navy-900/40 p-4 transition-all hover:border-blue-500/30 hover:bg-navy-900/80">
                    <div className="flex gap-3 items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-950 text-blue-400 ring-1 ring-blue-500/20">
                        <LuUser className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Teachers</h3>
                        <p className="mt-1 text-[11px] text-navy-400">Quickly book projectors or computer laboratories (no login needed).</p>
                      </div>
                    </div>
                    <Link
                      href="/teacher-booking"
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy-800 py-2 text-xs font-semibold text-white transition-all hover:bg-navy-700 active:scale-[0.98]"
                    >
                      Book a Resource <LuArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Admin & Approver Card */}
                  <div className="rounded-xl border border-navy-700/50 bg-navy-900/40 p-4 transition-all hover:border-indigo-500/30 hover:bg-navy-900/80">
                    <div className="flex gap-3 items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 ring-1 ring-indigo-500/20">
                        <LuKeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Approvers &amp; Admins</h3>
                        <p className="mt-1 text-[11px] text-navy-400">Senior Masters, Student Welfare Head, and portal administrators.</p>
                      </div>
                    </div>
                    <Link
                      href="/patron/login"
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
                    >
                      Approver &amp; Admin Login <LuArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t border-navy-800/80 pt-6 text-center text-[11px] text-navy-400">
          <p>© {new Date().getFullYear()} Starehe Boys&apos; Centre &amp; School. All rights reserved.</p>
          <p className="mt-1 text-navy-500">Designed for care, discipline, and academic excellence.</p>
        </footer>
      </div>
    </div>
  );
}

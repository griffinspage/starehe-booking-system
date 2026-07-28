'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuShieldCheck, LuLock, LuMail, LuBuilding2, LuCircleCheck } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { patronLoginSchema } from '@/utils/validation';

const ROLE_REDIRECTS = {
  club_patron: '/patron/dashboard',
  sm1: '/approvals/sm1',
  sm2: '/approvals/sm2',
  sm3: '/approvals/sm3',
  sm4: '/approvals/sm4',
  welfare_head: '/approvals/welfare',
  admin: '/admin',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(patronLoginSchema) });

  async function onSubmit({ email, password }) {
    setSubmitting(true);
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    toast.success('Welcome back!');

    const redirectedFrom = searchParams.get('redirectedFrom');
    const destination = redirectedFrom || ROLE_REDIRECTS[profile?.role] || '/patron/dashboard';

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left branding panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-12 text-white lg:flex">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-96 w-96 rounded-full bg-navy-500/20 blur-3xl" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
          >
            <LuArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-xl ring-4 ring-gold-400/20">
            <LuShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
              Starehe Boys&apos; Centre & School
            </span>
            <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-white">
              Student Function & Resource Booking System
            </h1>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Unified portal for Club Patrons, Senior Masters, Student Welfare, and Administrators. Manage facility reservations, master lists, and approval workflows.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <LuCircleCheck className="h-4 w-4 text-gold-400 shrink-0" />
              <span>Multi-tier sequential approval workflow</span>
            </div>
            <div className="flex items-center gap-2.5">
              <LuCircleCheck className="h-4 w-4 text-gold-400 shrink-0" />
              <span>Real-time digital signatures & PDF authorization export</span>
            </div>
            <div className="flex items-center gap-2.5">
              <LuCircleCheck className="h-4 w-4 text-gold-400 shrink-0" />
              <span>Centralized resource inventory & club management</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 font-mono">
          Natulenge Juu · Founded 1959
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full items-center justify-center bg-surface-muted px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-navy-600">
              <LuArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-3 border border-navy-100">
              <LuLock className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold text-navy-900">System Sign In</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Enter your credentials to access your portal dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-7 shadow-card">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="name@starehe.ac.ke"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end pt-1">
              <Link href="/patron/forgot-password" className="text-xs font-semibold text-navy-600 hover:text-navy-800 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full font-semibold py-3" loading={submitting}>
              Sign In to Portal
            </Button>
          </form>

          <div className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-ink-muted">
              New Club Patron?{' '}
              <Link href="/patron/signup" className="font-bold text-navy-600 hover:underline">
                Register Your Club Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted p-8 text-center">Loading portal...</p>}>
      <LoginForm />
    </Suspense>
  );
}
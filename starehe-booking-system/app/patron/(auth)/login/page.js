'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuLogIn } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { patronLoginSchema } from '@/utils/validation';

// Maps every possible `users.role` value to where that person should land
// after logging in. This is the single login page for everyone — club
// patrons, all five approver roles, and admins all authenticate here.
const ROLE_REDIRECTS = {
  club_patron: '/patron/dashboard',
  sm1: '/approvals/sm1',
  sm2: '/approvals/sm2',
  sm3: '/approvals/sm3',
  sm4: '/approvals/sm4',
  welfare_head: '/approvals/welfare',
  admin: '/admin',
};

export default function LoginPage() {
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

    // Look up their role so we know where they actually belong.
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    toast.success('Welcome back!');

    // If a redirectedFrom param exists (middleware sent them here trying to
    // reach a protected page directly), honor it — otherwise fall back to
    // wherever their role belongs.
    const redirectedFrom = searchParams.get('redirectedFrom');
    const destination = redirectedFrom || ROLE_REDIRECTS[profile?.role] || '/patron/dashboard';

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          <LuArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
            <LuLogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-navy-700">Sign In</h1>
            <p className="text-xs text-ink-faint">Club Patrons, Senior Masters, and Student Welfare staff log in here.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
          <Input id="email" type="email" label="Email" placeholder="you@starehe.ac.ke" error={errors.email?.message} {...register('email')} />
          <Input id="password" type="password" label="Password" error={errors.password?.message} {...register('password')} />

          <div className="flex justify-end">
            <Link href="/patron/forgot-password" className="text-xs font-medium text-navy-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Login
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          New club patron?{' '}
          <Link href="/patron/signup" className="font-semibold text-navy-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
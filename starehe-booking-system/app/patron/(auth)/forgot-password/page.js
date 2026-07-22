'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuMailQuestion } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email address.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/patron/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/patron/login" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          <LuArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
            <LuMailQuestion className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-navy-700">Forgot Password</h1>
            <p className="text-xs text-ink-faint">We&apos;ll email you a link to reset it.</p>
          </div>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-ink">
              If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
            </p>
            <p className="mt-2 text-xs text-ink-faint">Check your inbox (and spam folder) for the email.</p>
            <Link href="/patron/login" className="btn-secondary mt-5 inline-flex">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5 p-6">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="patron@starehe.ac.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={submitting}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
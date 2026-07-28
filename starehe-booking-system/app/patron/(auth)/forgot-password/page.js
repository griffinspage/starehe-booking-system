'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuKeyRound, LuShieldCheck } from 'react-icons/lu';
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/patron/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-navy-600">
          <LuArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
          <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-gold-500/10 blur-2xl" />
            <div className="relative z-10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-md">
              <LuKeyRound className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-white relative z-10">Reset Your Password</h1>
            <p className="mt-1 text-xs text-slate-300 relative z-10">
              Enter your registered Starehe email to receive a password recovery link.
            </p>
          </div>

          <div className="p-7">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
                  If an account exists for <span className="font-bold">{email}</span>, a password reset link has been dispatched to your inbox.
                </div>
                <p className="text-xs text-ink-faint">Check your email inbox and spam folder.</p>
                <Link href="/patron/login" className="btn-secondary w-full justify-center">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  label="Registered Email"
                  placeholder="name@starehe.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full py-3 font-semibold" loading={submitting}>
                  Send Recovery Link
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
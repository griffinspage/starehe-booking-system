'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LuLockKeyhole } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

// Reached only via the link in the password-reset email. Supabase's client
// library automatically exchanges the token in the URL for a temporary
// recovery session — by the time this component mounts, supabase.auth
// already has a valid session for the account being reset.

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Fires once Supabase has parsed the recovery token from the URL and
    // established a session for it.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Fallback: if a session already exists by the time this mounts (e.g. on
    // a fast reload), don't leave the user stuck waiting for the event.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated. Please log in.');
      await supabase.auth.signOut();
      router.push('/patron/login');
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
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
            <LuLockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-navy-700">Set a New Password</h1>
            <p className="text-xs text-ink-faint">Choose a new password for your account.</p>
          </div>
        </div>

        {!sessionReady ? (
          <div className="card p-6 text-center text-sm text-ink-muted">
            Verifying your reset link…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5 p-6">
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={submitting}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
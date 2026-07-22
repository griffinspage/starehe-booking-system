'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuUsers } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { patronSignupSchema } from '@/utils/validation';

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(patronSignupSchema) });

  async function onSubmit({ clubName, email, password }) {
    setSubmitting(true);
    const supabase = createClient();

    try {
      // Create the auth user (metadata will trigger DB profile creation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { club_name: clubName } },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      toast.success('Account created. Check your email to confirm, then log in.');
      router.push('/patron/login');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong creating your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          <LuArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
            <LuUsers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-navy-700">Club Patron Sign Up</h1>
            <p className="text-xs text-ink-faint">Create your account to book and manage functions.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
          <Input id="clubName" label="Club Name" placeholder="e.g. Drama Club" error={errors.clubName?.message} {...register('clubName')} />
          <Input id="email" type="email" label="Email" placeholder="patron@starehe.ac.ke" error={errors.email?.message} {...register('email')} />
          <Input id="password" type="password" label="Password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
          <Input id="confirmPassword" type="password" label="Confirm Password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

          <Button type="submit" className="w-full" loading={submitting}>
            Create Account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link href="/patron/login" className="font-semibold text-navy-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

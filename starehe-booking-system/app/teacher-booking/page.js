'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LuArrowLeft, LuProjector, LuMonitor, LuCircleCheck } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { teacherBookingSchema } from '@/utils/validation';

export default function TeacherBookingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(teacherBookingSchema),
  });

  const selectedItem = watch('item');

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not complete the booking.');
        return;
      }

      toast.success('Booking confirmed!');
      setResult(data.booking);
      reset();
    } catch (err) {
      console.error(err);
      toast.error('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-status-approved">
            <LuCircleCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">Booking Confirmed</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your booking number is
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-navy-600">{result.booking_number}</p>
          <p className="mt-3 text-xs text-ink-faint">
            Please note this number down — you&apos;ll need it if you return the item or have any queries.
          </p>
          <Button className="mt-6 w-full" onClick={() => setResult(null)}>
            Make another booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-10">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <LuArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-semibold text-navy-700">Teacher Booking</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Book a projector or computer laboratory. No account needed.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-5 p-6">
          <Input
            id="teacherName"
            label="Teacher Name"
            placeholder="e.g. Jane Wanjiru"
            error={errors.teacherName?.message}
            {...register('teacherName')}
          />
          <Input
            id="department"
            label="Department"
            placeholder="e.g. Mathematics"
            error={errors.department?.message}
            {...register('department')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@starehe.ac.ke"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="phoneNumber"
              label="Phone Number"
              placeholder="07XX XXX XXX"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
          </div>

          <div>
            <p className="label">Item</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('item', 'projector', { shouldValidate: true })}
                className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                  selectedItem === 'projector'
                    ? 'border-navy-500 bg-navy-50 text-navy-600'
                    : 'border-border text-ink-muted hover:bg-surface-muted'
                }`}
              >
                <LuProjector className="h-5 w-5" /> Projector
              </button>
              <button
                type="button"
                onClick={() => setValue('item', 'computer_lab', { shouldValidate: true })}
                className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                  selectedItem === 'computer_lab'
                    ? 'border-navy-500 bg-navy-50 text-navy-600'
                    : 'border-border text-ink-muted hover:bg-surface-muted'
                }`}
              >
                <LuMonitor className="h-5 w-5" /> Computer Lab
              </button>
            </div>
            {errors.item && <p className="field-error">{errors.item.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input id="date" type="date" label="Date" error={errors.date?.message} {...register('date')} />
            <Input id="time" type="time" label="Time" error={errors.time?.message} {...register('time')} />
          </div>

          <Input
            id="duration"
            label="Duration"
            placeholder="e.g. 2 hours, or 'Double lesson'"
            error={errors.duration?.message}
            {...register('duration')}
          />

          <Textarea
            id="purpose"
            label="Purpose"
            placeholder="What is this for?"
            error={errors.purpose?.message}
            {...register('purpose')}
          />

          <Button type="submit" className="w-full" loading={submitting}>
            Submit Booking
          </Button>
        </form>
      </div>
    </div>
  );
}

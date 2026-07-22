'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LuTriangleAlert, LuProjector, LuBus, LuMonitor } from 'react-icons/lu';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { bookResourceSchema, validateThreeDayRule } from '@/utils/validation';

const RESOURCE_OPTIONS = [
  { value: 'projector', label: 'Projector', icon: LuProjector },
  { value: 'bus', label: 'School Bus', icon: LuBus },
  { value: 'computer_lab', label: 'Computer Laboratory', icon: LuMonitor },
];

export default function BookResourcePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dateWarning, setDateWarning] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookResourceSchema),
    defaultValues: { resources: [], quantity: 1 },
  });

  const functionDate = watch('functionDate');
  const selectedResources = watch('resources') || [];

  useEffect(() => {
    const { valid, message } = validateThreeDayRule(functionDate);
    setDateWarning(valid ? '' : message);
  }, [functionDate]);

  const isBlocked = useMemo(() => Boolean(dateWarning), [dateWarning]);

  function toggleResource(value) {
    const current = selectedResources.includes(value)
      ? selectedResources.filter((r) => r !== value)
      : [...selectedResources, value];
    setValue('resources', current, { shouldValidate: true });
  }

  async function onSubmit(values) {
    const { valid, message } = validateThreeDayRule(values.functionDate);
    if (!valid) {
      toast.error(message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings/club-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not create the booking.');
        return;
      }

      toast.success('Function booked! Continue to the Master List.');
      router.push(`/patron/master-list?bookingId=${data.booking.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Book Resources</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Start a new club function. Bookings must be made at least three days in advance.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-5 p-6">
        <Input
          id="functionName"
          label="Function Name"
          placeholder="e.g. Inter-house Drama Festival"
          error={errors.functionName?.message}
          {...register('functionName')}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Input
              id="functionDate"
              type="date"
              label="Function Date"
              error={errors.functionDate?.message}
              {...register('functionDate')}
            />
          </div>
          <Input id="venue" label="Venue" placeholder="e.g. Main Hall" error={errors.venue?.message} {...register('venue')} />
        </div>

        {dateWarning && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-status-rejected">
            <LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{dateWarning}</p>
          </div>
        )}

        <Textarea id="purpose" label="Purpose" placeholder="What is this function for?" error={errors.purpose?.message} {...register('purpose')} />

        <Input
          id="expectedStudents"
          type="number"
          min="1"
          label="Expected Number of Students"
          error={errors.expectedStudents?.message}
          {...register('expectedStudents')}
        />

        <div>
          <p className="label">Resources Needed</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {RESOURCE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = selectedResources.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleResource(value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                    active ? 'border-navy-500 bg-navy-50 text-navy-600' : 'border-border text-ink-muted hover:bg-surface-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </div>
          {errors.resources && <p className="field-error">{errors.resources.message}</p>}
        </div>

        <Input id="quantity" type="number" min="1" label="Quantity" error={errors.quantity?.message} {...register('quantity')} />

        <Textarea
          id="specialRequirements"
          label="Special Requirements"
          placeholder="Optional — anything else the office should know"
          error={errors.specialRequirements?.message}
          {...register('specialRequirements')}
        />

        <Button type="submit" className="w-full" loading={submitting} disabled={isBlocked}>
          Submit
        </Button>
      </form>
    </div>
  );
}

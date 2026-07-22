// utils/validation.js
// Central Zod (JavaScript, no TS) schemas used by React Hook Form across the app.

import { z } from 'zod';

export const teacherBookingSchema = z.object({
  teacherName: z.string().min(2, 'Enter the teacher\'s full name'),
  department: z.string().min(2, 'Enter a department'),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(10, 'Enter a valid phone number'),
  item: z.enum(['projector', 'computer_lab'], {
    errorMap: () => ({ message: 'Select a resource' }),
  }),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  purpose: z.string().min(5, 'Briefly describe the purpose'),
  duration: z.string().min(1, 'Enter the expected duration'),
});

export const patronSignupSchema = z
  .object({
    clubName: z.string().min(2, 'Enter the club name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const patronLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const bookResourceSchema = z.object({
  functionName: z.string().min(2, 'Enter the function name'),
  functionDate: z.string().min(1, 'Select a function date'),
  venue: z.string().min(2, 'Enter a venue'),
  purpose: z.string().min(5, 'Describe the purpose of the function'),
  expectedStudents: z.coerce.number().int().positive('Enter the expected number of students'),
  resources: z
    .array(z.enum(['projector', 'bus', 'computer_lab']))
    .min(1, 'Select at least one resource'),
  quantity: z.coerce.number().int().positive('Enter a quantity'),
  specialRequirements: z.string().optional(),
});

export const requisitionSchema = z.object({
  needsBus: z.boolean().optional(),
  needsFood: z.boolean().optional(),
  needsWater: z.boolean().optional(),
  needsProjector: z.boolean().optional(),
  needsComputerLab: z.boolean().optional(),
  needsSoundSystem: z.boolean().optional(),
  needsMicrophone: z.boolean().optional(),
  needsOther: z.boolean().optional(),
  otherDescription: z.string().optional(),
  requirementsDescription: z.string().min(5, 'Describe what you need'),
  estimatedStudents: z.coerce.number().int().positive('Enter an estimate'),
  departureTime: z.string().min(1, 'Enter a departure time'),
  returnTime: z.string().min(1, 'Enter a return time'),
  specialNotes: z.string().optional(),
});

/**
 * The Three-Day Rule: a club function must be booked at least 3 full days
 * before the function date. Returns { valid, message }.
 */
export function validateThreeDayRule(functionDateStr) {
  if (!functionDateStr) return { valid: true, message: '' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const functionDate = new Date(functionDateStr);
  functionDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((functionDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 3) {
    return {
      valid: false,
      message: 'Too late. Bookings must be made at least three days before the function date.',
    };
  }

  return { valid: true, message: '' };
}

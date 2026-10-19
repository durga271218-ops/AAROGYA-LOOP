import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import { z } from 'zod';

export function zodFormResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values: parsed.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join('.') || 'root';
      if (!errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}

export const loginSchema = z.object({
  email: z.email('Enter the email address for the account.'),
  password: z.string().min(1, 'Enter the password.'),
});

export const registerSchema = z
  .object({
    role: z.enum(['patient', 'doctor', 'caregiver']),
    name: z.string().trim().min(2, 'Enter your full name.'),
    email: z.email('Enter a valid email address.'),
    phone: z.string().trim().min(8, 'Enter a phone number.'),
    city: z.string().trim().min(2, 'Enter a city.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string(),
    dateOfBirth: z.string().optional(),
    specialty: z.string().optional(),
    registrationNumber: z.string().optional(),
    relationship: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
    if (value.role === 'patient' && !value.dateOfBirth) {
      context.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Enter a date of birth.' });
    }
    if (value.role === 'doctor') {
      if (!value.specialty?.trim()) {
        context.addIssue({ code: 'custom', path: ['specialty'], message: 'Enter a specialty. This does not verify it.' });
      }
      if (!value.registrationNumber?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['registrationNumber'],
          message: 'Enter a registration number. Selecting doctor does not verify it.',
        });
      }
    }
    if (value.role === 'caregiver' && !value.relationship?.trim()) {
      context.addIssue({ code: 'custom', path: ['relationship'], message: 'Describe your relationship to the patient.' });
    }
  });

export const medicationSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter the name as it should appear on the reminder.'),
    dosage: z.string().trim().min(1, 'Enter the dosage as written. Do not guess a dose.'),
    frequency: z.enum(['once-daily', 'twice-daily', 'three-times-daily', 'weekly', 'as-needed']),
    time1: z.string(),
    time2: z.string(),
    time3: z.string(),
    weekday: z.string(),
    startDate: z.string().min(1, 'Choose a start date.'),
    notes: z.string().max(400, 'Keep notes under 400 characters.'),
    instructions: z.string().max(400, 'Keep instructions under 400 characters.'),
  })
  .superRefine((value, context) => {
    const times = [value.time1, value.time2, value.time3].slice(
      0,
      value.frequency === 'three-times-daily' ? 3 : value.frequency === 'twice-daily' ? 2 : value.frequency === 'as-needed' ? 0 : 1,
    );
    if (times.some((time) => !/^\d{2}:\d{2}$/.test(time))) {
      context.addIssue({ code: 'custom', path: ['time1'], message: 'Enter a time for each scheduled reminder.' });
    }
  });

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Choose a patient.'),
  clinicianId: z.string(),
  clinicianName: z.string().trim().min(2, 'Enter the clinician’s name.'),
  date: z.string().min(1, 'Choose a date.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time.'),
  durationMin: z.string().min(1),
  reason: z.string().trim().min(3, 'Enter the reason for the visit.'),
  location: z.string().trim().min(2, 'Enter a location.'),
  notes: z.string().max(400, 'Keep notes under 400 characters.'),
});

export const followUpSchema = z.object({
  patientId: z.string().min(1, 'Choose a patient.'),
  title: z.string().trim().min(3, 'Name this follow-up.'),
  dueOn: z.string().min(1, 'Choose a due date.'),
  appointmentId: z.string(),
  prescriptionId: z.string(),
  notes: z.string().max(400, 'Keep notes under 400 characters.'),
  nextAction: z.string().trim().min(3, 'Say what should happen next.'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  phone: z.string().trim().min(8, 'Enter a phone number.'),
  city: z.string().trim().min(2, 'Enter a city.'),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password.'),
    next: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .superRefine((value, context) => {
    if (value.next !== value.confirm) {
      context.addIssue({ code: 'custom', path: ['confirm'], message: 'Passwords do not match.' });
    }
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type MedicationValues = z.infer<typeof medicationSchema>;
export type AppointmentValues = z.infer<typeof appointmentSchema>;
export type FollowUpValues = z.infer<typeof followUpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;

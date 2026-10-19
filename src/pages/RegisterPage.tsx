import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthFrame } from './AuthFrame.tsx';
import { Button } from '../components/ui/Button.tsx';
import { PasswordField, TextField } from '../components/ui/Fields.tsx';
import { Notice } from '../components/ui/Surface.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { Role } from '../types/models.ts';
import { homeForRole } from '../utils/scope.ts';
import { cx } from '../utils/text.ts';
import { registerSchema, zodFormResolver, type RegisterValues } from '../utils/validators.ts';

const roles: Array<{ id: Role; label: string; detail: string }> = [
  { id: 'patient', label: 'Patient', detail: 'Your own reminders and visits' },
  { id: 'doctor', label: 'Doctor', detail: 'A panel you are assigned' },
  { id: 'caregiver', label: 'Caregiver', detail: 'People linked to you' },
];

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodFormResolver(registerSchema),
    defaultValues: {
      role: 'patient',
      name: '',
      email: '',
      phone: '',
      city: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      specialty: '',
      registrationNumber: '',
      relationship: '',
    },
  });
  const role = watch('role');

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    setFormError('');
    await new Promise((resolve) => setTimeout(resolve, 200));
    const result = createAccount({
      role: values.role,
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
      password: values.password,
      dateOfBirth: values.dateOfBirth || undefined,
      specialty: values.specialty,
      registrationNumber: values.registrationNumber,
      relationship: values.relationship,
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    navigate(homeForRole(result.user.role), { replace: true });
  }

  return (
    <AuthFrame title="Create an account" lede="This creates a demo account in this browser only. It does not open a clinical record anywhere else.">
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset>
          <legend className="text-sm font-semibold text-navy">I am joining as</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {roles.map((item) => (
              <label key={item.id} className={cx('rounded-lg border p-3', role === item.id ? 'border-teal bg-mint' : 'border-line')}>
                <input
                  type="radio"
                  className="sr-only"
                  value={item.id}
                  checked={role === item.id}
                  onChange={() => setValue('role', item.id, { shouldValidate: true })}
                />
                <span className="block font-semibold text-navy">{item.label}</span>
                <span className="block text-xs text-muted">{item.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {role === 'doctor' ? <Notice tone="warning">Choosing doctor does not verify your identity or registration. This demo will not assign patients to a new clinician account.</Notice> : null}
        {role === 'caregiver' ? <Notice>A new caregiver is not linked to anyone yet. The sample caregiver sign-in already has two linked people.</Notice> : null}
        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        <TextField label="City" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
        {role === 'patient' ? <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} /> : null}
        {role === 'doctor' ? (
          <>
            <TextField label="Specialty" hint="Shown on your profile. Not checked against a registry." error={errors.specialty?.message} {...register('specialty')} />
            <TextField label="Registration number" hint="Stored as text you typed. Not verified." error={errors.registrationNumber?.message} {...register('registrationNumber')} />
          </>
        ) : null}
        {role === 'caregiver' ? <TextField label="Relationship" hint="For example, daughter or neighbor." error={errors.relationship?.message} {...register('relationship')} /> : null}
        <PasswordField label="Password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        {formError ? <p role="alert" className="text-sm text-red">{formError}</p> : null}
        <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create demo account'}</Button>
      </form>
      <p className="mt-4 text-sm">Already have a demo account? <Link to="/login" className="font-semibold text-teal">Sign in</Link></p>
    </AuthFrame>
  );
}

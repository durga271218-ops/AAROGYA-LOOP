import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthFrame } from './AuthFrame.tsx';
import { Button } from '../components/ui/Button.tsx';
import { PasswordField, TextField } from '../components/ui/Fields.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { DEMO_LOGINS } from '../mocks/seed.ts';
import { homeForRole } from '../utils/scope.ts';
import { loginSchema, zodFormResolver, type LoginValues } from '../utils/validators.ts';

export function LoginPage() {
  const { login, clearExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const expired = Boolean((location.state as { expired?: boolean } | null)?.expired);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginValues>({
    resolver: zodFormResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    setFormError('');
    await new Promise((resolve) => setTimeout(resolve, 200));
    const result = login(values.email, values.password);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    clearExpired();
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/login' ? from : homeForRole(result.user.role), { replace: true });
  }

  return (
    <AuthFrame title="Sign in" lede="Use a sample account, or an account you created in this browser. Passwords are checked locally and are not sent to a server.">
      {expired ? <p role="alert" className="mb-4 rounded-lg bg-amber-bg px-3 py-2 text-sm">Your demo session expired. Sign in again to continue.</p> : null}
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        {formError ? <p role="alert" className="text-sm text-red">{formError}</p> : null}
        <Button type="submit" disabled={submitting}>{submitting ? 'Checking…' : 'Sign in'}</Button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/forgot-password" className="font-semibold text-teal">Forgot password</Link>
        <span className="text-muted"> · </span>
        <Link to="/register" className="font-semibold text-teal">Create an account</Link>
      </p>
      <div className="mt-6 border-t border-line pt-4">
        <p className="text-sm font-semibold text-navy">Sample accounts</p>
        <ul className="mt-2 grid gap-2">
          {DEMO_LOGINS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                className="w-full rounded-lg border border-line px-3 py-2 text-left hover:bg-mint"
                onClick={() => {
                  setValue('email', account.email, { shouldValidate: true });
                  setValue('password', account.password, { shouldValidate: true });
                }}
              >
                <span className="block text-sm font-semibold text-navy">{account.name} · {account.role}</span>
                <span className="block text-xs text-muted">{account.email} · {account.password}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthFrame>
  );
}

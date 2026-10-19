import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from '../../utils/text.ts';

const control =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink outline-none focus-visible:border-teal';

export function FieldShell({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  ...props
}: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cx(control, error && 'border-red')}
        {...props}
      />
    </FieldShell>
  );
}

export function PasswordField({
  label,
  error,
  id,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} error={error} id={inputId}>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cx(control, 'pr-12', error && 'border-red')}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  id,
  ...props
}: { label: string; hint?: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId}>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cx(control, 'min-h-24', error && 'border-red')}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...props
}: { label: string; hint?: string; error?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const inputId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId}>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cx(control, error && 'border-red')}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

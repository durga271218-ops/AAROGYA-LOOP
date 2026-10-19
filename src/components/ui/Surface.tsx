import type { ReactNode } from 'react';
import { cx, initials } from '../../utils/text.ts';

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-xl border border-line bg-white p-4 sm:p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl text-navy">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const badgeTones = {
  teal: 'bg-mint text-teal-deep',
  amber: 'bg-amber-bg text-amber',
  neutral: 'bg-foam text-ink',
  red: 'bg-red-bg text-red',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold', badgeTones[tone])}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-line bg-foam px-4 py-8 text-center">
      <h3 className="font-sans text-lg font-semibold text-navy">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red/30 bg-red-bg px-4 py-6">
      <h2 className="font-sans text-lg font-semibold text-red">Something needs attention</h2>
      <p className="mt-1 text-sm text-ink">{message}</p>
      {onRetry ? (
        <button type="button" className="mt-3 text-sm font-semibold text-teal underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-mint', className)} />;
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="grid gap-4">
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-24" />
      <SkeletonBlock className="h-48" />
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-sm font-semibold text-teal-deep">
      {initials(name)}
    </span>
  );
}

export function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl text-navy">{value}</p>
      <p className="mt-1 text-sm">{detail}</p>
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p className={cx('rounded-lg border px-3 py-2 text-sm', tone === 'warning' ? 'border-amber/30 bg-amber-bg text-ink' : 'border-line bg-mint text-ink')}>
      {children}
    </p>
  );
}

import { cx } from '../utils/text.ts';

export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const ink = tone === 'light' ? '#ffffff' : '#0c2340';
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 17a8 8 0 1 1 8 8" fill="none" stroke="#0e5c59" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M24 15a8 8 0 1 1-8-8" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.35rem] leading-none" style={{ color: ink }}>
        Aarogya Loop
      </span>
    </span>
  );
}

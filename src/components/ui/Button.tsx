import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/text.ts';

const variants = {
  primary: 'bg-teal text-white hover:bg-teal-deep',
  secondary: 'border border-line bg-white text-navy hover:bg-mint',
  ghost: 'text-navy hover:bg-mint',
  danger: 'bg-red text-white hover:bg-red/90',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'min-h-11 px-4',
};

export function buttonClass(variant: keyof typeof variants = 'primary', size: keyof typeof sizes = 'md', className?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  size = 'md',
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

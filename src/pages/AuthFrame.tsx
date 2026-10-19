import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.tsx';
import { RedirectIfSignedIn } from '../routes/guards.tsx';

export function AuthFrame({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <RedirectIfSignedIn>
      <div className="min-h-screen bg-foam">
        <a href="#main" className="skip-link">Skip to content</a>
        <header className="mx-auto flex max-w-lg items-center justify-between px-4 py-6">
          <Link to="/" aria-label="Aarogya Loop home"><Logo /></Link>
          <Link to="/" className="text-sm font-semibold text-teal">Back to site</Link>
        </header>
        <main id="main" className="mx-auto max-w-lg px-4 pb-16">
          <p className="text-sm font-semibold text-teal">Browser demo</p>
          <h1 className="mt-1 text-4xl text-navy">{title}</h1>
          <p className="mt-2 text-muted">{lede}</p>
          <div className="mt-6 rounded-xl border border-line bg-white p-5">{children}</div>
        </main>
      </div>
    </RedirectIfSignedIn>
  );
}

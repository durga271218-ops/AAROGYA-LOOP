import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { homeForRole } from '../utils/scope.ts';

export function NotFoundPage() {
  return (
    <StatusShell title="That page is not part of Aarogya Loop" body="Check the address, or return to the start." />
  );
}

export function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <StatusShell
      title="This view is for a different role"
      body="The page you opened belongs to another kind of account. Your own dashboard is the right place to continue."
      home={user ? homeForRole(user.role) : '/login'}
      homeLabel={user ? 'Go to your dashboard' : 'Sign in'}
    />
  );
}

function StatusShell({ title, body, home = '/', homeLabel = 'Back to the start' }: { title: string; body: string; home?: string; homeLabel?: string }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-content-center gap-4 px-4">
      <Logo />
      <h1 className="text-4xl text-navy">{title}</h1>
      <p className="text-muted">{body}</p>
      <Link to={home} className="font-semibold text-teal">{homeLabel}</Link>
    </main>
  );
}

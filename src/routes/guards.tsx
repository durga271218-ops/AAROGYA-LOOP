import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CareProvider } from '../context/CareContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { PageSkeleton } from '../components/ui/Surface.tsx';
import type { Role } from '../types/models.ts';

export function RequireAuth() {
  const { user, ready, expired } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="p-8"><PageSkeleton /></div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname, expired }} />;
  }
  return <Outlet />;
}

export function AuthenticatedShell() {
  return (
    <CareProvider>
      <AppLayout />
    </CareProvider>
  );
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-8"><PageSkeleton /></div>;
  if (user) {
    const home = user.role === 'doctor' ? '/doctor/dashboard' : user.role === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
}

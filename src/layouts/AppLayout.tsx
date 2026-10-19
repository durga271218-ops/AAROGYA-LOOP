import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, CalendarDays, FileText, FolderHeart, LayoutDashboard, LogOut, Menu as MenuIcon, Pill, RefreshCcw, Settings, UserRound, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo.tsx';
import { Avatar, ErrorState, PageSkeleton } from '../components/ui/Surface.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCare } from '../context/CareContext.tsx';
import { markNotificationRead } from '../services/care.ts';
import type { AppNotification, Role } from '../types/models.ts';
import { ageFrom } from '../utils/dates.ts';
import { cx } from '../utils/text.ts';

const icons = {
  today: LayoutDashboard,
  meds: Pill,
  visits: CalendarDays,
  rx: FileText,
  follow: RefreshCcw,
  records: FolderHeart,
  bell: Bell,
};

function navigation(role: Role) {
  const shared = [
    { to: role === 'doctor' ? '/doctor/dashboard' : role === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard', label: role === 'caregiver' ? 'Care today' : role === 'doctor' ? 'Overview' : 'Today', icon: icons.today },
    { to: '/medications', label: role === 'caregiver' ? 'Reminders' : 'Medications', icon: icons.meds },
    { to: '/appointments', label: 'Appointments', icon: icons.visits },
  ];
  shared.push({ to: '/prescriptions', label: 'Prescriptions', icon: icons.rx });
  shared.push(
    { to: '/follow-ups', label: 'Follow-ups', icon: icons.follow },
    { to: '/health-records', label: 'Records', icon: icons.records },
    { to: '/notifications', label: 'Notifications', icon: icons.bell },
  );
  return shared;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { data, ready, error, refresh, activePatient, setActivePatientId, textSize } = useCare();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) return null;
  const unread = data?.notifications.filter((item) => !item.read).length ?? 0;
  const items = navigation(user.role);

  return (
    <div className="min-h-screen bg-foam text-ink" data-text-size={textSize}>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="lg:grid lg:grid-cols-[15.5rem_1fr]">
        <aside className="hidden min-h-screen flex-col bg-navy text-white lg:flex">
          <div className="px-4 py-5">
            <Logo tone="light" />
          </div>
          <nav aria-label="Application" className="grid gap-1 px-3">
            {items.map((item) => (
              <SideLink key={item.to} to={item.to} label={item.label} icon={item.icon} badge={item.to === '/notifications' ? unread : 0} />
            ))}
          </nav>
          <div className="mt-auto grid gap-1 px-3 py-4">
            <SideLink to="/profile" label="Profile" icon={UserRound} />
            <SideLink to="/settings" label="Settings" icon={Settings} />
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-line bg-white">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-mint lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
                <MenuIcon size={20} />
              </button>
              <Logo className="lg:hidden" />
              <div className="ml-auto flex items-center gap-2">
                {user.role === 'doctor' && data ? (
                  <label className="hidden text-sm font-semibold sm:block">
                    <span className="sr-only">Panel filter</span>
                    <select
                      className="rounded-lg border border-line bg-white px-3 py-2"
                      value={activePatient?.id ?? ''}
                      onChange={(event) => setActivePatientId(event.target.value || null)}
                    >
                      <option value="">All people on your panel</option>
                      {data.patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <NotificationMenu
                  items={data?.notifications.slice(0, 4) ?? []}
                  unread={unread}
                  onOpen={(item) => {
                    markNotificationRead(user.id, item.id);
                    refresh();
                    navigate(item.href);
                  }}
                  onViewAll={() => navigate('/notifications')}
                />
                <ProfileMenu name={user.name} onProfile={() => navigate('/profile')} onSettings={() => navigate('/settings')} onLogout={logout} />
              </div>
            </div>
            <p className="bg-navy px-4 py-1.5 text-sm text-white md:px-6">Browser demo. Sample records stay on this device and are not a clinical system.</p>
          </header>
          {user.role === 'caregiver' ? (
            <div className="border-b border-line bg-white px-4 py-4 md:px-6">
              {activePatient ? (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-teal">Viewing this person</p>
                    <p className="font-display text-3xl text-navy">{activePatient.name}</p>
                    <p className="text-sm text-muted">
                      {activePatient.dateOfBirth ? `${ageFrom(activePatient.dateOfBirth)} years` : 'Age not recorded'}
                      {' · '}
                      {data?.links.find((link) => link.patientId === activePatient.id)?.relationship ?? 'Linked patient'}
                    </p>
                  </div>
                  {data && data.patients.length > 1 ? (
                    <label className="text-sm font-semibold text-navy">
                      Switch person
                      <select
                        className="mt-1 block min-w-52 rounded-lg border border-line px-3 py-2"
                        value={activePatient.id}
                        onChange={(event) => setActivePatientId(event.target.value)}
                      >
                        {data.patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>{patient.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm">No patient is linked to this account.</p>
              )}
            </div>
          ) : null}
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 md:px-6">
            {!ready ? <PageSkeleton /> : error || !data ? <ErrorState message={error ?? 'Records could not be loaded.'} onRetry={refresh} /> : <Outlet />}
          </main>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-navy/50 lg:hidden">
          <div className="flex h-full w-72 flex-col bg-navy p-4 text-white">
            <div className="mb-4 flex items-center justify-between">
              <Logo tone="light" />
              <button type="button" aria-label="Close menu" className="grid h-11 w-11 place-items-center" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <nav aria-label="Application" className="grid gap-1" onClick={() => setOpen(false)}>
              {items.map((item) => (
                <SideLink key={item.to} to={item.to} label={item.label} icon={item.icon} badge={item.to === '/notifications' ? unread : 0} />
              ))}
              <SideLink to="/profile" label="Profile" icon={UserRound} />
              <SideLink to="/settings" label="Settings" icon={Settings} />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SideLink({ to, label, icon: Icon, badge = 0 }: { to: string; label: string; icon: typeof Bell; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold', isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10')}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
      {badge > 0 ? <span className="ml-auto rounded bg-amber-bg px-1.5 text-xs font-semibold text-amber">{badge}</span> : null}
    </NavLink>
  );
}

function NotificationMenu({
  items,
  unread,
  onOpen,
  onViewAll,
}: {
  items: AppNotification[];
  unread: number;
  onOpen: (item: AppNotification) => void;
  onViewAll: () => void;
}) {
  return (
    <Menu
      label={
        <span className="relative grid h-11 w-11 place-items-center rounded-lg hover:bg-mint" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell size={18} />
          {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber" /> : null}
        </span>
      }
    >
      {items.length === 0 ? <p className="px-3 py-2 text-sm text-muted">No reminders right now.</p> : null}
      {items.map((item) => (
        <button key={item.id} type="button" role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-mint" onClick={() => onOpen(item)}>
          <span className="block text-sm font-semibold text-navy">{item.title}</span>
          <span className="block text-xs text-muted">{item.read ? 'Read' : 'Unread'} · {item.priority === 'attention' ? 'Needs attention' : 'Routine'}</span>
        </button>
      ))}
      <button type="button" role="menuitem" className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-teal hover:bg-mint" onClick={onViewAll}>
        View all notifications
      </button>
    </Menu>
  );
}

function ProfileMenu({ name, onProfile, onSettings, onLogout }: { name: string; onProfile: () => void; onSettings: () => void; onLogout: () => void }) {
  return (
    <Menu label={<span className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-mint"><Avatar name={name} /><span className="hidden text-sm font-semibold sm:inline">{name}</span></span>}>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-mint" onClick={onProfile}>
        <UserRound size={16} /> Profile
      </button>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-mint" onClick={onSettings}>
        <Settings size={16} /> Settings
      </button>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-mint" onClick={onLogout}>
        <LogOut size={16} /> Log out
      </button>
    </Menu>
  );
}

function Menu({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-line bg-white p-1 shadow-sm" onClick={() => setOpen(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button.tsx';
import { Badge, EmptyState, PageHeader } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { markAllNotificationsRead, markNotificationRead } from '../services/care.ts';

export function NotificationsPage() {
  const { data, refresh } = useCare();
  const [filter, setFilter] = useState('all');
  const [browserNote, setBrowserNote] = useState('');
  if (!data) return null;
  const items = data.notifications.filter((item) => filter === 'all' || item.type === filter || (filter === 'unread' && !item.read));

  async function enableBrowser() {
    if (!('Notification' in window)) {
      setBrowserNote('This browser does not offer desktop alerts.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setBrowserNote('On-screen alerts are allowed in this browser tab. No email, SMS, or background push is configured.');
      new Notification('Aarogya Loop demo', { body: 'This is a local test alert. Nothing was sent to a server.' });
    } else {
      setBrowserNote('Permission was not granted. No alert will be shown.');
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Notifications"
        description="Reminders generated from the records you can see. Nothing is emailed or texted."
        actions={<Button variant="secondary" onClick={() => { markAllNotificationsRead(data.user.id); refresh(); toast.success('All current reminders marked read.'); }}>Mark all read</Button>}
      />
      <div className="flex flex-wrap gap-2">
        {[['all', 'All'], ['unread', 'Unread'], ['medication', 'Medication'], ['appointment', 'Appointments'], ['follow-up', 'Follow-ups']].map(([id, label]) => (
          <button key={id} type="button" className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === id ? 'bg-navy text-white' : 'bg-white'}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="No reminders in this view" body="New medication, visit, and follow-up reminders show up here when they apply to you." /> : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy">{item.title}</p>
                <Badge tone={item.priority === 'attention' ? 'amber' : 'neutral'}>{item.read ? 'Read' : 'Unread'} · {item.priority === 'attention' ? 'Needs attention' : 'Routine'}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              <div className="mt-3 flex gap-3 text-sm font-semibold">
                {!item.read ? <button type="button" className="text-teal" onClick={() => { markNotificationRead(data.user.id, item.id); refresh(); }}>Mark read</button> : null}
                <Link to={item.href} className="text-teal">Open</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="text-2xl text-navy">On this device</h2>
        <p className="mt-1 text-sm text-muted">Browser alerts are requested only when you press the button. They are not email, SMS, or background notifications.</p>
        <Button className="mt-3" variant="secondary" onClick={() => void enableBrowser()}>Enable a test browser alert</Button>
        {browserNote ? <p role="status" className="mt-3 text-sm">{browserNote}</p> : null}
        <p className="mt-3 text-sm"><Link to="/settings" className="font-semibold text-teal">Notification preferences</Link></p>
      </section>
    </div>
  );
}

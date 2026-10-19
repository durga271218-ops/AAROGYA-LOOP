import { Link } from 'react-router-dom';
import { AdherenceChart } from '../components/charts/Charts.tsx';
import { ButtonLink } from '../components/ui/Button.tsx';
import { Badge, Metric, Panel } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { addDays, formatDateTime, formatTime, formatWeekdayDate, toISODate } from '../utils/dates.ts';
import { adherenceSummary, isActionableDose } from '../utils/doses.ts';
import { DOSE_LABEL } from '../utils/labels.ts';

export function PatientDashboard() {
  const { data } = useCare();
  if (!data) return null;
  const now = new Date();
  const today = toISODate(now);
  const doses = data.doses.filter((dose) => dose.patientId === data.user.id && dose.date === today);
  const recentFrom = addDays(today, -1);
  const attention = data.doses.filter((dose) => dose.patientId === data.user.id && dose.date >= recentFrom && isActionableDose(dose, now));
  const upcoming = data.appointments.filter((item) => item.status === 'upcoming').slice(0, 3);
  const followUps = data.followUps.filter((item) => item.state !== 'completed').slice(0, 3);
  const summary = adherenceSummary(data.doses.filter((dose) => dose.patientId === data.user.id), addDays(today, -13), today, now);
  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const percent = summary.total ? Math.round((summary.taken / summary.total) * 100) : null;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-teal">{formatWeekdayDate(today)}</p>
        <h1 className="text-4xl text-navy">{hello}, {data.user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-muted">Here is what is on your schedule. Reminder statuses are records of what was selected, not proof a dose was taken.</p>
      </div>
      {attention.length > 0 ? (
        <section className="rounded-xl border border-amber/30 bg-amber-bg p-4">
          <h2 className="font-sans text-lg font-semibold text-navy">Needs a status</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {attention.slice(0, 4).map((dose) => (
              <li key={dose.id}>{dose.name} {dose.dosage} · {formatTime(dose.time)} · {dose.date === today ? 'Today' : 'Earlier'}</li>
            ))}
          </ul>
          <Link to="/medications" className="mt-2 inline-block text-sm font-semibold text-teal">Review reminders</Link>
        </section>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Open reminders" value={String(attention.length)} detail="Scheduled time has passed with no status" />
        <Metric label="Recorded as taken" value={percent === null ? '—' : `${percent}%`} detail={`${summary.taken} of ${summary.total} past reminders in 14 days`} />
        <Metric label="Open follow-ups" value={String(data.followUps.filter((item) => item.state !== 'completed').length)} detail="Upcoming or overdue check-ins" />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/medications" variant="secondary">View medications</ButtonLink>
        <ButtonLink to="/appointments" variant="secondary">Appointments</ButtonLink>
        <ButtonLink to="/prescriptions" variant="secondary">Prescriptions</ButtonLink>
        <ButtonLink to="/follow-ups" variant="secondary">Follow-ups</ButtonLink>
        <ButtonLink to="/settings" variant="secondary">Caregiver access</ButtonLink>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Today’s medication schedule" className="lg:col-span-3">
          {doses.length === 0 ? <p className="text-sm text-muted">Nothing is scheduled today.</p> : (
            <ul className="divide-y divide-line">
              {doses.map((dose) => (
                <li key={dose.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-muted">{formatTime(dose.time)}</p>
                    <p className="font-semibold text-navy">{dose.name} · {dose.dosage}</p>
                  </div>
                  <Badge tone={dose.status === 'taken' ? 'teal' : dose.status === 'scheduled' ? 'neutral' : 'amber'}>{DOSE_LABEL[dose.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Upcoming appointments" className="lg:col-span-2" action={<Link to="/appointments" className="text-sm font-semibold text-teal">View</Link>}>
          {upcoming.length === 0 ? <p className="text-sm text-muted">No upcoming visits.</p> : (
            <ul className="grid gap-3">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <p className="font-semibold text-navy">{item.reason}</p>
                  <p className="text-sm text-muted">{formatDateTime(item.startsAt)} · {item.clinicianName}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Reminder status, last 14 days" className="lg:col-span-3">
          <AdherenceChart days={summary.days} />
        </Panel>
        <Panel title="Follow-ups and activity" className="lg:col-span-2">
          <ul className="grid gap-3">
            {followUps.map((item) => (
              <li key={item.id}>
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-muted">{item.state === 'overdue' ? 'Overdue' : 'Upcoming'} · {item.nextAction}</p>
              </li>
            ))}
            {data.activity.slice(0, 3).map((item) => (
              <li key={item.id}>
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Recent prescriptions" action={<Link to="/prescriptions" className="text-sm font-semibold text-teal">View</Link>}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.prescriptions.slice(0, 2).map((item) => (
            <li key={item.id} className="rounded-lg bg-foam p-3">
              <p className="font-semibold text-navy">{item.clinicianName}</p>
              <p className="text-sm text-muted">{item.items.map((entry) => entry.name).join(', ')}</p>
              <p className="text-sm">Sample record. Not a verified document.</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

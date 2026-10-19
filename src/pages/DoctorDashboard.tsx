import { Link } from 'react-router-dom';
import { CountChart } from '../components/charts/Charts.tsx';
import { ButtonLink } from '../components/ui/Button.tsx';
import { Badge, Metric, Panel } from '../components/ui/Surface.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCare } from '../context/CareContext.tsx';
import { addDays, formatDate, formatDateTime, formatWeekdayDate, toISODate } from '../utils/dates.ts';
import { isActionableDose } from '../utils/doses.ts';
import { personName } from '../utils/text.ts';

export function DoctorDashboard() {
  const { user } = useAuth();
  const { data, setActivePatientId } = useCare();
  if (!data || !user) return null;
  const now = new Date();
  const today = toISODate(now);
  const monthAppointments = data.appointments.filter((item) => toISODate(new Date(item.startsAt)).slice(0, 7) === today.slice(0, 7));
  const todayVisits = data.appointments.filter((item) => toISODate(new Date(item.startsAt)) === today);
  const upcoming = data.appointments.filter((item) => item.status === 'upcoming' && new Date(item.startsAt) >= now).slice(0, 4);
  const followUps = data.followUps.filter((item) => item.state !== 'completed');
  const pending = data.prescriptions.filter((item) => item.status === 'pending-review');
  const chart = [
    { label: 'Completed', count: monthAppointments.filter((item) => item.status === 'completed').length },
    { label: 'Upcoming', count: monthAppointments.filter((item) => item.status === 'upcoming').length },
    { label: 'Cancelled', count: monthAppointments.filter((item) => item.status === 'cancelled').length },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-teal">{formatWeekdayDate(today)}</p>
        <h1 className="text-4xl text-navy">Good day, {user.name}</h1>
        <p className="mt-1 max-w-2xl text-muted">This overview includes only the people assigned to you. Another clinician’s patients are not listed here.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="People on your panel" value={String(data.patients.length)} detail="Assigned in this demo" />
        <Metric label="Visits today" value={String(todayVisits.length)} detail="Completed or still on today’s book" />
        <Metric label="Follow-ups to watch" value={String(followUps.length)} detail="Upcoming or overdue on your panel" />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/appointments" variant="secondary">Today’s book</ButtonLink>
        <ButtonLink to="/prescriptions" variant="secondary">Review prescriptions</ButtonLink>
        <ButtonLink to="/follow-ups" variant="secondary">Follow-ups</ButtonLink>
        {data.patients[0] ? (
          <ButtonLink to={`/patients/${data.patients[0].id}`} variant="secondary">Open a record</ButtonLink>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Your panel" className="lg:col-span-3">
          {data.patients.length === 0 ? <p className="text-sm text-muted">No patients are assigned to this account.</p> : (
            <ul className="divide-y divide-line">
              {data.patients.map((patient) => {
                const next = data.appointments.find((item) => item.patientId === patient.id && item.status === 'upcoming');
                const open = data.doses.filter((dose) => dose.patientId === patient.id && dose.date >= addDays(today, -1) && isActionableDose(dose, now)).length;
                return (
                  <li key={patient.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-navy">{patient.name}</p>
                      <p className="text-sm text-muted">{next ? `Next: ${next.reason} · ${formatDateTime(next.startsAt)}` : 'No upcoming visit'} · {open} open reminder{open === 1 ? '' : 's'}</p>
                    </div>
                    <Link to={`/patients/${patient.id}`} className="text-sm font-semibold text-teal" onClick={() => setActivePatientId(patient.id)}>Open record</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Today’s appointments" className="lg:col-span-2">
          {todayVisits.length === 0 ? <p className="text-sm text-muted">Nothing is booked today.</p> : (
            <ul className="grid gap-3">
              {todayVisits.map((item) => (
                <li key={item.id}>
                  <p className="font-semibold text-navy">{personName(data.people, item.patientId)}</p>
                  <p className="text-sm text-muted">{item.reason} · {formatDateTime(item.startsAt)}</p>
                  <Badge tone={item.status === 'completed' ? 'teal' : 'neutral'}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Appointment status this month" className="lg:col-span-3">
          <CountChart data={chart} label="Bar chart of appointment statuses this month" empty="No appointments fall in the current month." />
        </Panel>
        <Panel title="Needs a look" className="lg:col-span-2">
          <h3 className="font-sans text-sm font-semibold text-muted">Follow-ups</h3>
          <ul className="mt-2 grid gap-2">
            {followUps.slice(0, 3).map((item) => (
              <li key={item.id} className="text-sm">
                <span className="font-semibold text-navy">{personName(data.people, item.patientId)}</span> · {item.title} · {item.state}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-sans text-sm font-semibold text-muted">Uploads waiting</h3>
          {pending.length === 0 ? <p className="mt-1 text-sm text-muted">No uploaded prescriptions are waiting.</p> : pending.map((item) => (
            <p key={item.id} className="mt-1 text-sm">{personName(data.people, item.patientId)} · {formatDate(item.issuedOn)}</p>
          ))}
          <h3 className="mt-4 font-sans text-sm font-semibold text-muted">Coming up</h3>
          <ul className="mt-2 grid gap-2 text-sm">
            {upcoming.map((item) => <li key={item.id}>{personName(data.people, item.patientId)} · {item.reason}</li>)}
          </ul>
        </Panel>
      </div>
      <Panel title="Recent activity">
        <ul className="grid gap-3">
          {data.activity.slice(0, 5).map((item) => (
            <li key={item.id}>
              <p className="font-semibold text-navy">{item.title}</p>
              <p className="text-sm text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

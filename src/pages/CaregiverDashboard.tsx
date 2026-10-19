import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CountChart } from '../components/charts/Charts.tsx';
import { Button, ButtonLink } from '../components/ui/Button.tsx';
import { ConfirmDialog } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, Panel } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { setDoseStatus } from '../services/care.ts';
import type { Dose, DoseOverride } from '../types/models.ts';
import { addDays, formatDateTime, formatTime, formatWeekdayDate, toISODate } from '../utils/dates.ts';
import { isActionableDose } from '../utils/doses.ts';
import { DOSE_LABEL } from '../utils/labels.ts';

export function CaregiverDashboard() {
  const { data, activePatient } = useCare();
  const save = useSave();
  const [pending, setPending] = useState<{ dose: Dose; status: DoseOverride['status'] } | null>(null);
  if (!data) return null;
  if (!activePatient) {
    return (
      <EmptyState
        title="No linked patients"
        body="This caregiver account is not linked to anyone. The sample sign-in for Priya Mehta is linked to Aarav Mehta and Lakshmi Nair. Linking a real person needs an account service, which is not connected."
        action={<ButtonLink to="/settings" variant="secondary">View access settings</ButtonLink>}
      />
    );
  }
  const now = new Date();
  const today = toISODate(now);
  const doses = data.doses.filter((dose) => dose.patientId === activePatient.id && dose.date === today);
  const actionable = data.doses.filter((dose) => dose.patientId === activePatient.id && dose.date >= addDays(today, -1) && isActionableDose(dose, now));
  const upcoming = data.appointments.filter((item) => item.patientId === activePatient.id && item.status === 'upcoming').slice(0, 3);
  const followUps = data.followUps.filter((item) => item.patientId === activePatient.id && item.state !== 'completed');
  const chart = [
    { label: 'Taken', count: doses.filter((dose) => dose.status === 'taken').length },
    { label: 'Skipped', count: doses.filter((dose) => dose.status === 'skipped').length },
    { label: 'Missed', count: doses.filter((dose) => dose.status === 'missed').length },
    { label: 'Open', count: doses.filter((dose) => dose.status === 'unrecorded' || dose.status === 'scheduled').length },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-teal">{formatWeekdayDate(today)}</p>
        <h1 className="text-4xl text-navy">Care for {activePatient.name}</h1>
        <p className="mt-1 text-muted">You are updating {activePatient.name}. Switch people from the bar above before recording a status.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Today’s reminders" className="lg:col-span-3">
          {doses.length === 0 ? <p className="text-sm text-muted">Nothing is scheduled today.</p> : (
            <ul className="divide-y divide-line">
              {doses.map((dose) => (
                <li key={dose.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-muted">{formatTime(dose.time)} · {activePatient.name}</p>
                    <p className="font-semibold text-navy">{dose.name} · {dose.dosage}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={dose.status === 'unrecorded' ? 'amber' : 'neutral'}>{DOSE_LABEL[dose.status]}</Badge>
                    {dose.status === 'unrecorded' ? (
                      <Button size="sm" variant="secondary" onClick={() => setPending({ dose, status: 'taken' })}>Record taken</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Still open" className="lg:col-span-2">
          {actionable.length === 0 ? <p className="text-sm text-muted">No past reminder is waiting for a status.</p> : (
            <ul className="grid gap-2 text-sm">
              {actionable.map((dose) => <li key={dose.id}>{dose.name} · {formatTime(dose.time)}</li>)}
            </ul>
          )}
          <h3 className="mt-4 font-sans text-sm font-semibold text-muted">Follow-ups</h3>
          <ul className="mt-2 grid gap-2 text-sm">
            {followUps.map((item) => <li key={item.id}>{item.title} · {item.state}</li>)}
          </ul>
        </Panel>
        <Panel title="Today’s reminder statuses" className="lg:col-span-3">
          <CountChart data={chart} label="Bar chart of today’s reminder statuses" empty="No reminders are scheduled today." />
        </Panel>
        <Panel title="Visits and updates" className="lg:col-span-2">
          {upcoming.map((item) => (
            <p key={item.id} className="mb-2 text-sm"><span className="font-semibold text-navy">{item.reason}</span><br />{formatDateTime(item.startsAt)}</p>
          ))}
          {data.activity.filter((item) => item.patientId === activePatient.id).slice(0, 3).map((item) => (
            <p key={item.id} className="mb-2 text-sm text-muted">{item.title}</p>
          ))}
          <Link to="/appointments" className="text-sm font-semibold text-teal">All appointments</Link>
        </Panel>
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={`Record this for ${activePatient.name}?`}
        body={<p>You are updating <strong>{activePatient.name}</strong>. Marking “taken” stores that status. It does not confirm the medication was consumed.</p>}
        confirmLabel="Record as taken"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const ok = save(() => setDoseStatus(data.user.id, pending.dose.id, pending.status), `Status saved for ${activePatient.name}.`);
          if (ok) setPending(null);
        }}
      />
    </div>
  );
}

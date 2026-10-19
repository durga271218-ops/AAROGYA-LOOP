import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { SelectField, TextArea, TextField } from '../components/ui/Fields.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, PageHeader } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { cancelAppointment, completeAppointment, createAppointment, rescheduleAppointment } from '../services/care.ts';
import type { Appointment } from '../types/models.ts';
import { formatDateTime, startOfMonth, toISODate } from '../utils/dates.ts';
import { matchesQuery, personName } from '../utils/text.ts';
import { appointmentSchema, zodFormResolver, type AppointmentValues } from '../utils/validators.ts';

export function AppointmentsPage() {
  const { data, activePatientId } = useCare();
  const save = useSave();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(toISODate(new Date()));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false);
  const [current, setCurrent] = useState<Appointment | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [move, setMove] = useState({ date: '', time: '' });
  const [confirmMove, setConfirmMove] = useState(false);
  if (!data) return null;

  const patientId = data.user.role === 'patient' ? data.user.id : activePatientId;
  const items = data.appointments.filter((item) => {
    if (data.user.role === 'caregiver' && item.patientId !== patientId) return false;
    if (data.user.role === 'patient' && item.patientId !== data.user.id) return false;
    if (data.user.role === 'doctor' && patientId && item.patientId !== patientId) return false;
    if (status === 'rescheduled') return Boolean(item.rescheduledFrom);
    if (status !== 'all' && item.status !== status) return false;
    return matchesQuery(query, [item.reason, item.location, item.clinicianName, personName(data.people, item.patientId)]);
  });
  const marked = new Set(items.map((item) => toISODate(new Date(item.startsAt))));
  const dayItems = items.filter((item) => toISODate(new Date(item.startsAt)) === selected);
  const days = monthDays(month);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Appointments"
        description="Visits for the people you are allowed to see. Cancelling or moving a visit asks you to confirm."
        actions={<Button onClick={() => setCreating(true)}>Add appointment</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <section className="rounded-xl border border-line bg-white p-4" aria-label="Calendar">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-mint" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
            <h2 className="font-sans text-base font-semibold text-navy">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            <button type="button" aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-mint" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => day ? (
              <button
                key={day}
                type="button"
                aria-pressed={selected === day}
                aria-label={`${day}${marked.has(day) ? ', has appointments' : ''}`}
                className={`h-10 rounded-lg text-sm ${selected === day ? 'bg-navy text-white' : 'hover:bg-mint'}`}
                onClick={() => setSelected(day)}
              >
                <span>{Number(day.slice(8))}</span>
                {marked.has(day) ? <span className={`mx-auto mt-0.5 block h-1 w-1 rounded-full ${selected === day ? 'bg-white' : 'bg-teal'}`} /> : null}
              </button>
            ) : <span key={`empty-${index}`} />)}
          </div>
        </section>
        <section className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-navy">Search
              <input className="rounded-lg border border-line px-3 py-2 font-normal" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-navy">Status
              <select className="rounded-lg border border-line px-3 py-2 font-normal" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </label>
          </div>
          <h2 className="font-sans text-lg font-semibold text-navy">On {selected}</h2>
          {dayItems.length === 0 ? <EmptyState title="No visits on this day" body="Choose another date or add an appointment." /> : (
            <ul className="grid gap-2">
              {dayItems.map((item) => (
                <li key={item.id}>
                  <button type="button" className="w-full rounded-xl border border-line bg-white p-4 text-left" onClick={() => { setCurrent(item); setMove({ date: toISODate(new Date(item.startsAt)), time: timeOf(item.startsAt) }); }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-navy">{item.reason}</p>
                      <Badge tone={item.status === 'completed' ? 'teal' : item.status === 'cancelled' ? 'neutral' : 'amber'}>{item.rescheduledFrom ? 'Rescheduled' : item.status}</Badge>
                    </div>
                    <p className="text-sm text-muted">{formatDateTime(item.startsAt)} · {personName(data.people, item.patientId)} · {item.clinicianName}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal open={creating} title="Add appointment" onClose={() => setCreating(false)} wide>
        <AppointmentForm onClose={() => setCreating(false)} />
      </Modal>
      <Modal open={Boolean(current)} title={current?.reason ?? 'Appointment'} onClose={() => setCurrent(null)}>
        {current ? (
          <div className="grid gap-3 text-sm">
            <p>{formatDateTime(current.startsAt)} · {current.durationMin} minutes</p>
            <p>{personName(data.people, current.patientId)} with {current.clinicianName}</p>
            <p>{current.location}</p>
            {current.notes ? <p>{current.notes}</p> : null}
            {current.rescheduledFrom ? <p>Previously {formatDateTime(current.rescheduledFrom)}.</p> : null}
            {new Date(current.startsAt) < new Date() && current.status === 'upcoming' ? <p>The scheduled time has passed. Update the status when you know what happened.</p> : null}
            {current.status !== 'cancelled' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="New date" type="date" value={move.date} onChange={(event) => setMove({ ...move, date: event.target.value })} />
                <TextField label="New time" type="time" value={move.time} onChange={(event) => setMove({ ...move, time: event.target.value })} />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {current.status !== 'cancelled' ? (
                <Button variant="secondary" onClick={() => setConfirmMove(true)}>Save new time</Button>
              ) : null}
              {current.status === 'upcoming' ? <Button variant="secondary" onClick={() => { const ok = save(() => completeAppointment(data.user.id, current.id), 'Marked completed.'); if (ok) setCurrent(null); }}>Mark completed</Button> : null}
              {current.status !== 'cancelled' ? <Button variant="danger" onClick={() => setCancelId(current.id)}>Cancel visit</Button> : null}
            </div>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={confirmMove}
        title="Move this appointment?"
        body="The previous time is kept on the record. This demo does not notify the other person."
        confirmLabel="Move appointment"
        onClose={() => setConfirmMove(false)}
        onConfirm={() => {
          if (!current) return;
          const ok = save(() => rescheduleAppointment(data.user.id, current.id, move.date, move.time), 'Appointment moved.');
          if (ok) {
            setConfirmMove(false);
            setCurrent(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel this appointment?"
        body="The visit stays in the list as cancelled. This demo does not notify anyone."
        confirmLabel="Cancel appointment"
        tone="danger"
        onClose={() => setCancelId(null)}
        onConfirm={() => {
          if (!cancelId) return;
          const ok = save(() => cancelAppointment(data.user.id, cancelId), 'Appointment cancelled.');
          if (ok) {
            setCancelId(null);
            setCurrent(null);
          }
        }}
      />
    </div>
  );
}

function AppointmentForm({ onClose }: { onClose: () => void }) {
  const { data, activePatient } = useCare();
  const save = useSave();
  const patients = data?.user.role === 'patient' && data.user ? [data.user] : data?.patients ?? [];
  const defaultPatient = activePatient?.id ?? patients[0]?.id ?? '';
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AppointmentValues>({
    resolver: zodFormResolver(appointmentSchema),
    defaultValues: {
      patientId: defaultPatient,
      clinicianId: data?.user.role === 'doctor' ? data.user.id : '',
      clinicianName: data?.user.role === 'doctor' ? data.user.name : '',
      date: toISODate(new Date()),
      time: '10:00',
      durationMin: '20',
      reason: '',
      location: 'Sample clinic, Indiranagar, Bengaluru',
      notes: '',
    },
  });
  if (!data) return null;
  const patientId = watch('patientId');
  const clinicians = data.assignments
    .filter((item) => item.patientId === patientId)
    .map((item) => data.people.find((person) => person.id === item.clinicianId))
    .filter((person): person is NonNullable<typeof person> => Boolean(person));

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={handleSubmit((values) => {
        const ok = save(() => createAppointment(data.user.id, {
          patientId: values.patientId,
          clinicianId: data.user.role === 'doctor' ? data.user.id : values.clinicianId || undefined,
          clinicianName: data.user.role === 'doctor' ? data.user.name : values.clinicianName,
          date: values.date,
          time: values.time,
          durationMin: Number(values.durationMin),
          reason: values.reason,
          location: values.location,
          notes: values.notes,
        }), 'Appointment added.');
        if (ok) onClose();
      })}
    >
      <SelectField label="Patient" error={errors.patientId?.message} {...register('patientId')}>
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </SelectField>
      {data.user.role === 'doctor' ? <p className="text-sm text-muted">You are the clinician for this visit.</p> : (
        <>
          <SelectField label="Linked clinician" {...register('clinicianId')}>
            <option value="">Name not in the linked list</option>
            {clinicians.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </SelectField>
          <TextField label="Clinician name" error={errors.clinicianName?.message} {...register('clinicianName')} />
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <TextField label="Time" type="time" error={errors.time?.message} {...register('time')} />
      </div>
      <SelectField label="Duration" {...register('durationMin')}>
        <option value="15">15 minutes</option>
        <option value="20">20 minutes</option>
        <option value="30">30 minutes</option>
        <option value="45">45 minutes</option>
      </SelectField>
      <TextField label="Reason" error={errors.reason?.message} {...register('reason')} />
      <TextField label="Location" error={errors.location?.message} {...register('location')} />
      <TextArea label="Notes" error={errors.notes?.message} {...register('notes')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button type="submit">Save appointment</Button>
      </div>
    </form>
  );
}

function monthDays(month: Date): Array<string | null> {
  const days: Array<string | null> = Array.from({ length: month.getDay() }, () => null);
  const cursor = new Date(month);
  while (cursor.getMonth() === month.getMonth()) {
    days.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function timeOf(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

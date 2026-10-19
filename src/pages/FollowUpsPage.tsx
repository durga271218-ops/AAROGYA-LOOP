import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button.tsx';
import { CountChart } from '../components/charts/Charts.tsx';
import { SelectField, TextArea, TextField } from '../components/ui/Fields.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, PageHeader, Panel } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { completeFollowUp, createFollowUp } from '../services/care.ts';
import type { FollowUp } from '../types/models.ts';
import { formatDate } from '../utils/dates.ts';
import { matchesQuery, personName } from '../utils/text.ts';
import { followUpSchema, zodFormResolver, type FollowUpValues } from '../utils/validators.ts';

export function FollowUpsPage() {
  const { data, activePatientId } = useCare();
  const save = useSave();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false);
  const [current, setCurrent] = useState<FollowUp & { state: string } | null>(null);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  if (!data) return null;
  const patientId = data.user.role === 'patient' ? data.user.id : activePatientId;
  const items = data.followUps.filter((item) => {
    if (data.user.role !== 'doctor' && item.patientId !== patientId) return false;
    if (data.user.role === 'doctor' && patientId && item.patientId !== patientId) return false;
    if (status !== 'all' && item.state !== status) return false;
    const owner = personName(data.people, item.clinicianId || item.caregiverId);
    return matchesQuery(query, [item.title, item.nextAction, personName(data.people, item.patientId), owner]);
  });
  const chart = [
    { label: 'Completed', count: data.followUps.filter((item) => item.state === 'completed').length },
    { label: 'Upcoming', count: data.followUps.filter((item) => item.state === 'upcoming').length },
    { label: 'Overdue', count: data.followUps.filter((item) => item.state === 'overdue').length },
  ];

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Follow-ups"
        description="Continuity of care: what was planned, what is due, and what is already done. A follow-up here is a reminder, not a clinical order."
        actions={<Button onClick={() => setCreating(true)} disabled={data.user.role !== 'doctor' && !patientId}>Add follow-up</Button>}
      />
      <Panel title="Completion across visible follow-ups">
        <CountChart data={chart} label="Bar chart of follow-up completion" empty="No follow-ups are visible yet." />
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-navy">Search
          <input className="rounded-lg border border-line px-3 py-2 font-normal" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-navy">Status
          <select className="rounded-lg border border-line px-3 py-2 font-normal" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
      {items.length === 0 ? <EmptyState title="No follow-ups match" body="Adjust the filters or add the next check-in." /> : (
        <ol className="relative grid gap-4 border-l border-teal pl-5">
          {items.map((item) => (
            <li key={item.id}>
              <span className={`absolute -left-1.5 mt-2 h-3 w-3 rounded-full ${item.state === 'completed' ? 'bg-teal' : item.state === 'overdue' ? 'bg-amber' : 'bg-navy'}`} />
              <button type="button" className="w-full rounded-xl border border-line bg-white p-4 text-left" onClick={() => { setCurrent(item); setNote(''); }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{item.title}</p>
                  <Badge tone={item.state === 'completed' ? 'teal' : 'amber'}>{item.state}</Badge>
                </div>
                <p className="text-sm text-muted">{personName(data.people, item.patientId)} · due {formatDate(item.dueOn)}</p>
                <p className="mt-1 text-sm">{item.nextAction}</p>
              </button>
            </li>
          ))}
        </ol>
      )}
      <Modal open={creating} title="Add a follow-up" description="This reminds someone to check in. It is not a medical order." onClose={() => setCreating(false)}>
        <FollowForm onClose={() => setCreating(false)} />
      </Modal>
      <Modal open={Boolean(current)} title={current?.title ?? 'Follow-up'} onClose={() => setCurrent(null)}>
        {current ? (
          <div className="grid gap-3 text-sm">
            <p>Due {formatDate(current.dueOn)} · {current.state}</p>
            <p>Person: {personName(data.people, current.patientId)}</p>
            <p>Responsible: {personName(data.people, current.clinicianId || current.caregiverId)}</p>
            {current.appointmentId ? <p>Linked appointment: {data.appointments.find((item) => item.id === current.appointmentId)?.reason ?? current.appointmentId}</p> : null}
            {current.prescriptionId ? <p>Linked prescription: {current.prescriptionId}</p> : null}
            <p>{current.notes}</p>
            <p className="font-semibold">Next action: {current.nextAction}</p>
            {current.state !== 'completed' ? (
              <>
                <TextArea label="Completion note" value={note} onChange={(event) => setNote(event.target.value)} />
                <Button onClick={() => setConfirming(true)}>Mark complete</Button>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="Mark this follow-up complete?"
        body="This records that the check-in is done in the demo. It does not create a clinical result."
        confirmLabel="Mark complete"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          if (!current) return;
          const ok = save(() => completeFollowUp(data.user.id, current.id, note), 'Follow-up marked complete.');
          if (ok) {
            setConfirming(false);
            setCurrent(null);
          }
        }}
      />
    </div>
  );
}

function FollowForm({ onClose }: { onClose: () => void }) {
  const { data, activePatient } = useCare();
  const save = useSave();
  const patients = data?.user.role === 'patient' && data ? [data.user] : data?.patients ?? [];
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FollowUpValues>({
    resolver: zodFormResolver(followUpSchema),
    defaultValues: {
      patientId: activePatient?.id ?? patients[0]?.id ?? '',
      title: '',
      dueOn: '',
      appointmentId: '',
      prescriptionId: '',
      notes: '',
      nextAction: '',
    },
  });
  if (!data) return null;
  const patientId = watch('patientId');
  const appointments = data.appointments.filter((item) => item.patientId === patientId);
  const prescriptions = data.prescriptions.filter((item) => item.patientId === patientId);
  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit((values) => {
      const ok = save(() => createFollowUp(data.user.id, {
        patientId: values.patientId,
        title: values.title,
        dueOn: values.dueOn,
        clinicianId: data.user.role === 'doctor' ? data.user.id : undefined,
        caregiverId: data.user.role === 'caregiver' ? data.user.id : undefined,
        appointmentId: values.appointmentId || undefined,
        prescriptionId: values.prescriptionId || undefined,
        notes: values.notes,
        nextAction: values.nextAction,
      }), 'Follow-up added.');
      if (ok) onClose();
    })}>
      <SelectField label="Patient" error={errors.patientId?.message} {...register('patientId')}>
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </SelectField>
      <TextField label="Title" error={errors.title?.message} {...register('title')} />
      <TextField label="Due date" type="date" error={errors.dueOn?.message} {...register('dueOn')} />
      <SelectField label="Linked appointment" {...register('appointmentId')}>
        <option value="">None</option>
        {appointments.map((item) => <option key={item.id} value={item.id}>{item.reason}</option>)}
      </SelectField>
      <SelectField label="Linked prescription" {...register('prescriptionId')}>
        <option value="">None</option>
        {prescriptions.map((item) => <option key={item.id} value={item.id}>{item.items.map((entry) => entry.name).join(', ')}</option>)}
      </SelectField>
      <TextArea label="Notes" error={errors.notes?.message} {...register('notes')} />
      <TextArea label="Next action" error={errors.nextAction?.message} {...register('nextAction')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button type="submit">Save follow-up</Button>
      </div>
    </form>
  );
}

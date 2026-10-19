import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { AdherenceChart } from '../components/charts/Charts.tsx';
import { Button } from '../components/ui/Button.tsx';
import { SelectField, TextArea, TextField } from '../components/ui/Fields.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, Notice, PageHeader, Panel } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { createReminder, discontinueMedication, setDoseStatus, updateReminder } from '../services/care.ts';
import type { Dose, DoseOverride, Medication } from '../types/models.ts';
import { addDays, formatTime, toISODate, WEEKDAYS } from '../utils/dates.ts';
import { adherenceSummary, isActionableDose } from '../utils/doses.ts';
import { DOSE_LABEL, FREQUENCY_LABEL, SOURCE_LABEL, defaultTimes } from '../utils/labels.ts';
import { canCreateReminder, canRecordDose } from '../utils/scope.ts';
import { matchesQuery, personName } from '../utils/text.ts';
import { medicationSchema, zodFormResolver, type MedicationValues } from '../utils/validators.ts';
import { buildWorld } from '../services/world.ts';

export function MedicationsPage() {
  const { data, activePatientId } = useCare();
  const save = useSave();
  const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState<Medication | null>(null);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<{ dose: Dose; status: DoseOverride['status'] } | null>(null);
  const [stopId, setStopId] = useState<string | null>(null);
  if (!data) return null;

  const view = params.get('view') ?? 'today';
  const status = params.get('status') ?? 'all';
  const source = params.get('source') ?? 'all';
  const query = params.get('q') ?? '';
  const now = new Date();
  const today = toISODate(now);
  const patientId = data.user.role === 'patient' ? data.user.id : activePatientId;
  const world = buildWorld();
  const canAdd = patientId ? canCreateReminder(data.user, world, patientId) : false;
  const canMark = patientId ? canRecordDose(data.user, world, patientId) : data.user.role === 'doctor' ? false : false;

  const medications = data.medications.filter((item) => {
    if (patientId && item.patientId !== patientId) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (source !== 'all' && item.source !== source) return false;
    return matchesQuery(query, [item.name, item.dosage, personName(data.people, item.patientId)]);
  });
  const doses = data.doses.filter((dose) => !patientId || dose.patientId === patientId);
  const todayDoses = doses.filter((dose) => dose.date === today);
  const overdue = doses.filter((dose) => isActionableDose(dose, now) && dose.date < today && dose.date >= addDays(today, -1));
  const summary = adherenceSummary(doses, addDays(today, -13), today, now);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || (key === 'view' && value === 'today' && !value)) next.delete(key);
    if (key === 'view') next.set('view', value);
    else if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key === 'view' && value === 'today') next.delete('view');
    setParams(next);
  }

  const groups = [...todayDoses.reduce((map, dose) => {
    const list = map.get(dose.time) ?? [];
    list.push(dose);
    map.set(dose.time, list);
    return map;
  }, new Map<string, Dose[]>())];

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Medications"
        description="Prescribed entries and personal reminders are labeled separately. Recording a status does not prove a dose was taken."
        actions={canAdd && patientId ? <Button onClick={() => setCreating(true)}>Add reminder</Button> : undefined}
      />
      {!patientId && data.user.role === 'caregiver' ? (
        <EmptyState title="Choose a person first" body="Switch to a linked patient before viewing reminders." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Medication views">
            {[['today', 'Today'], ['all', 'All medications'], ['history', 'Adherence']].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={view === id} className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === id ? 'bg-navy text-white' : 'bg-white text-navy'}`} onClick={() => setParam('view', id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextFieldLite label="Search" value={query} onChange={(value) => setParam('q', value)} />
            <Filter label="Status" value={status} onChange={(value) => setParam('status', value)} options={[['all', 'All statuses'], ['active', 'Active'], ['completed', 'Completed'], ['discontinued', 'Discontinued']]} />
            <Filter label="Source" value={source} onChange={(value) => setParam('source', value)} options={[['all', 'All sources'], ['prescribed', 'Prescribed entry'], ['reminder', 'Personal reminder']]} />
          </div>
          <p className="sr-only" aria-live="polite">{medications.length} medications match.</p>
          {view === 'today' ? (
            <div className="grid gap-4">
              {overdue.length > 0 ? (
                <Panel title="Still open from earlier">
                  <DoseRows doses={overdue} people={data.people} canMark={canMark} onMark={setPending} />
                </Panel>
              ) : null}
              <Panel title="Today by time">
                {groups.length === 0 ? <EmptyState title="Nothing scheduled today" body="Active medications with a time will appear here." /> : groups.map(([time, rows]) => (
                  <div key={time} className="mb-4">
                    <h3 className="font-sans text-sm font-semibold text-muted">{formatTime(time)}</h3>
                    <DoseRows doses={rows} people={data.people} canMark={canMark} onMark={setPending} />
                  </div>
                ))}
              </Panel>
            </div>
          ) : null}
          {view === 'all' ? (
            medications.length === 0 ? <EmptyState title="No medications match" body="Try another filter, or add a personal reminder." /> : (
              <ul className="grid gap-3">
                {medications.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="w-full rounded-xl border border-line bg-white p-4 text-left hover:border-teal" onClick={() => setDetail(item)}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-navy">{item.name} · {item.dosage}</p>
                        <span className="flex gap-2">
                          <Badge tone={item.source === 'prescribed' ? 'teal' : 'neutral'}>{SOURCE_LABEL[item.source]}</Badge>
                          <Badge tone={item.status === 'active' ? 'teal' : 'neutral'}>{item.status}</Badge>
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{FREQUENCY_LABEL[item.frequency]} · {item.times.map(formatTime).join(', ') || 'No fixed time'}{data.user.role === 'doctor' && !patientId ? ` · ${personName(data.people, item.patientId)}` : ''}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {view === 'history' ? (
            <Panel title="Reminders recorded as taken, last 14 days">
              <p className="mb-3 text-sm text-muted">{summary.taken} of {summary.total} past reminders are recorded as taken. Skipped, missed, and not recorded are counted separately.</p>
              <AdherenceChart days={summary.days} />
            </Panel>
          ) : null}
        </>
      )}

      <Modal open={Boolean(detail)} title={detail ? `${detail.name} ${detail.dosage}` : 'Medication'} onClose={() => setDetail(null)}>
        {detail ? (
          <div className="grid gap-3 text-sm">
            <Notice>{detail.source === 'prescribed' ? 'This is a prescribed entry copied into the demo. It is not a new medical order.' : 'This is a personal reminder. It is not a prescription.'}</Notice>
            <p><span className="font-semibold">Schedule: </span>{FREQUENCY_LABEL[detail.frequency]} {detail.times.map(formatTime).join(', ')}</p>
            <p><span className="font-semibold">Instructions: </span>{detail.instructions}</p>
            {detail.notes ? <p><span className="font-semibold">Notes: </span>{detail.notes}</p> : null}
            <p><span className="font-semibold">Person: </span>{personName(data.people, detail.patientId)}</p>
            <div className="flex flex-wrap gap-2">
              {detail.source === 'reminder' && canAdd ? <Button variant="secondary" onClick={() => { setEditing(detail); setDetail(null); }}>Edit reminder</Button> : null}
              {detail.status === 'active' && ((detail.source === 'reminder' && canAdd) || (detail.source === 'prescribed' && data.user.role === 'doctor')) ? (
                <Button variant="danger" onClick={() => setStopId(detail.id)}>Discontinue</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={creating || Boolean(editing)} title={editing ? 'Edit reminder' : 'Add a personal reminder'} description="This does not create a prescription." onClose={() => { setCreating(false); setEditing(null); }}>
        {patientId ? (
          <MedicationForm
            key={editing?.id ?? 'new'}
            patientId={patientId}
            initial={editing ?? undefined}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSave={(values, existing) => {
              const times = values.frequency === 'as-needed' ? [] : values.frequency === 'twice-daily' ? [values.time1, values.time2] : values.frequency === 'three-times-daily' ? [values.time1, values.time2, values.time3] : [values.time1];
              const payload = {
                name: values.name,
                dosage: values.dosage,
                frequency: values.frequency,
                times,
                weekday: values.frequency === 'weekly' ? Number(values.weekday) : undefined,
                startDate: values.startDate,
                notes: values.notes,
                instructions: values.instructions || 'Personal reminder. This is not a prescription.',
                patientId,
              };
              const ok = existing
                ? save(() => updateReminder(data.user.id, existing.id, payload), 'Reminder updated.')
                : save(() => createReminder(data.user.id, payload), 'Personal reminder added.');
              return ok;
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Record this reminder status?"
        body={<p>This saves “{pending?.status}” for {pending?.dose.name}. It does not confirm the medication was consumed.</p>}
        confirmLabel={`Record as ${pending?.status ?? 'taken'}`}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const ok = save(() => setDoseStatus(data.user.id, pending.dose.id, pending.status), 'Reminder status saved.');
          if (ok) setPending(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(stopId)}
        title="Discontinue this entry?"
        body={<p>The demo record will be marked discontinued from today. This does not contact a pharmacy or a prescriber.</p>}
        confirmLabel="Discontinue"
        tone="danger"
        onClose={() => setStopId(null)}
        onConfirm={() => {
          if (!stopId) return;
          const ok = save(() => discontinueMedication(data.user.id, stopId), 'Entry discontinued in the demo.');
          if (ok) {
            setStopId(null);
            setDetail(null);
          }
        }}
      />
    </div>
  );
}

function DoseRows({ doses, people, canMark, onMark }: { doses: Dose[]; people: Array<{ id: string; name: string }>; canMark: boolean; onMark: (value: { dose: Dose; status: DoseOverride['status'] }) => void }) {
  return (
    <ul className="divide-y divide-line">
      {doses.map((dose) => (
        <li key={dose.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-semibold text-navy">{dose.name} · {dose.dosage}</p>
            <p className="text-sm text-muted">{personName(people, dose.patientId)} · {SOURCE_LABEL[dose.source]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={dose.status === 'taken' ? 'teal' : dose.status === 'scheduled' ? 'neutral' : 'amber'}>{DOSE_LABEL[dose.status]}</Badge>
            {canMark && dose.status !== 'scheduled' ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => onMark({ dose, status: 'taken' })}>Taken</Button>
                <Button size="sm" variant="secondary" onClick={() => onMark({ dose, status: 'skipped' })}>Skipped</Button>
                <Button size="sm" variant="secondary" onClick={() => onMark({ dose, status: 'missed' })}>Missed</Button>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MedicationForm({
  initial,
  patientId,
  onClose,
  onSave,
}: {
  initial?: Medication;
  patientId: string;
  onClose: () => void;
  onSave: (values: MedicationValues, existing?: Medication) => boolean;
}) {
  const times = initial?.times ?? defaultTimes('once-daily');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MedicationValues>({
    resolver: zodFormResolver(medicationSchema),
    defaultValues: {
      name: initial?.name ?? '',
      dosage: initial?.dosage ?? '',
      frequency: initial?.frequency ?? 'once-daily',
      time1: times[0] ?? '08:00',
      time2: times[1] ?? '20:00',
      time3: times[2] ?? '14:00',
      weekday: String(initial?.weekday ?? 1),
      startDate: initial?.startDate ?? toISODate(new Date()),
      notes: initial?.notes ?? '',
      instructions: initial?.instructions ?? '',
    },
  });
  const frequency = watch('frequency');
  return (
    <form
      className="grid gap-3"
      onSubmit={handleSubmit((values) => {
        if (onSave(values, initial)) onClose();
      })}
      noValidate
    >
      <input type="hidden" value={patientId} readOnly />
      <TextField label="Name" error={errors.name?.message} {...register('name')} />
      <TextField label="Dosage" hint="Type the dosage as written. Do not guess." error={errors.dosage?.message} {...register('dosage')} />
      <SelectField label="Frequency" {...register('frequency')}>
        {Object.entries(FREQUENCY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>
      {frequency !== 'as-needed' ? <TextField label="First time" type="time" error={errors.time1?.message} {...register('time1')} /> : null}
      {frequency === 'twice-daily' || frequency === 'three-times-daily' ? <TextField label="Second time" type="time" {...register('time2')} /> : null}
      {frequency === 'three-times-daily' ? <TextField label="Third time" type="time" {...register('time3')} /> : null}
      {frequency === 'weekly' ? (
        <SelectField label="Weekday" {...register('weekday')}>
          {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
        </SelectField>
      ) : null}
      <TextField label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
      <TextArea label="Instructions" {...register('instructions')} />
      <TextArea label="Notes" error={errors.notes?.message} {...register('notes')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initial ? 'Save reminder' : 'Add reminder'}</Button>
      </div>
    </form>
  );
}

function TextFieldLite({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <input className="rounded-lg border border-line px-3 py-2 font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <select className="rounded-lg border border-line px-3 py-2 font-normal" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  );
}

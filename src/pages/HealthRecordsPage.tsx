import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { SelectField, TextArea, TextField } from '../components/ui/Fields.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, Notice, PageHeader } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { addHealthRecord } from '../services/care.ts';
import type { HealthRecord } from '../types/models.ts';
import { formatDate, toISODate } from '../utils/dates.ts';
import { downloadText, matchesQuery, personName } from '../utils/text.ts';

const categories = [
  ['all', 'All categories'],
  ['visit', 'Visit notes'],
  ['prescription', 'Prescriptions'],
  ['other', 'Other'],
] as const;

export function HealthRecordsPage() {
  const { data, activePatientId, setActivePatientId } = useCare();
  const save = useSave();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [current, setCurrent] = useState<HealthRecord | null>(null);
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const needsChoice = data.user.role === 'doctor' && !activePatientId;
  const patientId = data.user.role === 'patient' ? data.user.id : activePatientId;
  const items = data.records.filter((item) => {
    if (patientId && item.patientId !== patientId) return false;
    if (!patientId && data.user.role === 'doctor') return false;
    if (category !== 'all' && item.category !== category) return false;
    return matchesQuery(query, [item.title, item.source, item.summary, personName(data.people, item.patientId)]);
  });

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Health records"
        description="Documents you are allowed to open. Files added here keep a name and a note in this browser. They are not uploaded to a server."
        actions={<Button onClick={() => setOpen(true)} disabled={!patientId}>Add document</Button>}
      />
      <Notice>Access is limited to your own record, your panel, or a linked patient. These checks are not a substitute for server-side authorization.</Notice>
      {needsChoice ? (
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="font-semibold text-navy">Choose one person on your panel</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.patients.map((patient) => (
              <Button key={patient.id} variant="secondary" onClick={() => setActivePatientId(patient.id)}>{patient.name}</Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-navy">Search
          <input className="rounded-lg border border-line px-3 py-2 font-normal" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-navy">Category
          <select className="rounded-lg border border-line px-3 py-2 font-normal" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
      {items.length === 0 ? <EmptyState title="No documents in this view" body="Select a person or add a document name to the demo." /> : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="w-full rounded-xl border border-line bg-white p-4 text-left" onClick={() => setCurrent(item)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{item.title}</p>
                  <Badge>{item.category}</Badge>
                </div>
                <p className="text-sm text-muted">{formatDate(item.date)} · {item.source} · {personName(data.people, item.patientId)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(current)} title={current?.title ?? 'Document'} onClose={() => setCurrent(null)}>
        {current ? (
          <div className="grid gap-3 text-sm">
            <Notice>Synthetic or user-entered demo text. Not a clinical document.</Notice>
            <p>{formatDate(current.date)} · {current.source}</p>
            <div className="rounded-lg border border-line bg-sand p-4 leading-6">{current.summary}</div>
            <Button variant="secondary" onClick={() => downloadText(`${current.id}.txt`, `${current.title}\n${current.summary}\n\nDemo document. Not verified.`)}>Download text</Button>
          </div>
        ) : null}
      </Modal>
      <Modal open={open} title="Add a document" description="Only the name and your note are stored." onClose={() => setOpen(false)}>
        {patientId ? <RecordForm patientId={patientId} onClose={() => setOpen(false)} onSave={(input) => save(() => addHealthRecord(data.user.id, input), 'Document note saved in this browser.')} /> : null}
      </Modal>
    </div>
  );
}

function RecordForm({
  patientId,
  onClose,
  onSave,
}: {
  patientId: string;
  onClose: () => void;
  onSave: (input: Omit<HealthRecord, 'id' | 'summary'> & { summary?: string }) => boolean;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HealthRecord['category']>('other');
  const [date, setDate] = useState(toISODate(new Date()));
  const [source, setSource] = useState('Added in the browser demo');
  const [summary, setSummary] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (title.trim().length < 3) {
        setError('Give the document a title.');
        return;
      }
      const ok = onSave({ patientId, title, category, date, source, summary, fileName: fileName || undefined });
      if (ok) onClose();
    }}>
      <TextField label="Title" value={title} error={error} onChange={(event) => setTitle(event.target.value)} />
      <SelectField label="Category" value={category} onChange={(event) => setCategory(event.target.value as HealthRecord['category'])}>
        <option value="visit">Visit note</option>
        <option value="prescription">Prescription</option>
        <option value="other">Other</option>
      </SelectField>
      <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <TextField label="Source" value={source} onChange={(event) => setSource(event.target.value)} />
      <label className="text-sm font-semibold text-navy">File name only
        <input className="mt-1 block w-full text-sm font-normal" type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
      </label>
      <TextArea label="Note" value={summary} onChange={(event) => setSummary(event.target.value)} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button type="submit">Save note</Button>
      </div>
    </form>
  );
}

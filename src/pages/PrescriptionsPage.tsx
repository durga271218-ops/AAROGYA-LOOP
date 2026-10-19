import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { SelectField, TextArea, TextField } from '../components/ui/Fields.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Badge, EmptyState, Notice, PageHeader } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { useSave } from '../hooks/useSave.ts';
import { createPrescription, reviewPrescription, saveUploadedPrescription } from '../services/care.ts';
import type { MedicationFrequency, Prescription } from '../types/models.ts';
import { formatDate, toISODate } from '../utils/dates.ts';
import { FREQUENCY_LABEL, defaultTimes } from '../utils/labels.ts';
import { downloadText, matchesQuery, personName } from '../utils/text.ts';

export function PrescriptionsPage() {
  const { data, activePatientId } = useCare();
  const save = useSave();
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState<Prescription | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  if (!data) return null;
  const patientId = data.user.role === 'patient' ? data.user.id : activePatientId;
  const items = data.prescriptions.filter((item) => {
    if (data.user.role !== 'doctor' && item.patientId !== patientId) return false;
    if (data.user.role === 'doctor' && patientId && item.patientId !== patientId) return false;
    return matchesQuery(query, [item.clinicianName, item.fileName, ...item.items.map((entry) => entry.name), personName(data.people, item.patientId)]);
  });

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Prescriptions"
        description="Sample records and uploads you have reviewed yourself. An upload is not medically verified."
        actions={
          data.user.role === 'doctor' ? (
            <Button onClick={() => setCreating(true)} disabled={data.patients.length === 0}>Add demo prescription</Button>
          ) : (
            <Button onClick={() => setUploading(true)} disabled={!patientId}>Upload for review</Button>
          )
        }
      />
      <label className="grid max-w-sm gap-1 text-sm font-semibold text-navy">Search
        <input className="rounded-lg border border-line px-3 py-2 font-normal" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {items.length === 0 ? <EmptyState title="No prescriptions" body="Assigned or uploaded prescriptions will appear here." /> : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="w-full rounded-xl border border-line bg-white p-4 text-left" onClick={() => setCurrent(item)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{item.items.map((entry) => entry.name).join(', ')}</p>
                  <Badge tone={item.status === 'pending-review' ? 'amber' : 'teal'}>{item.status === 'pending-review' ? 'Pending review' : item.status}</Badge>
                </div>
                <p className="text-sm text-muted">{personName(data.people, item.patientId)} · {item.clinicianName} · {formatDate(item.issuedOn)} · {item.source === 'demo-upload' ? 'Demo upload' : 'Sample record'}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(current)} title="Prescription detail" onClose={() => setCurrent(null)} wide>
        {current ? (
          <div className="grid gap-3 text-sm">
            <Notice>{current.source === 'demo-upload' ? 'This file was not read or medically verified.' : 'This is a typed sample. It was not dispensed.'}</Notice>
            <p>{personName(data.people, current.patientId)} · {current.clinicianName} · {formatDate(current.issuedOn)}</p>
            <ul className="grid gap-2">
              {current.items.map((item) => (
                <li key={`${item.name}-${item.dosage}`} className="rounded-lg bg-foam p-3">
                  <p className="font-semibold text-navy">{item.name} · {item.dosage}</p>
                  <p>{item.frequency}</p>
                  <p className="text-muted">{item.instructions}</p>
                </li>
              ))}
            </ul>
            <p>{current.notes}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadText(`${current.id}.txt`, prescriptionText(current, personName(data.people, current.patientId)))}>Download text</Button>
              {data.user.role === 'doctor' && current.status === 'pending-review' ? (
                <Button onClick={() => {
                  const ok = save(() => reviewPrescription(data.user.id, current.id), 'Marked reviewed in the demo. This is not clinical verification.');
                  if (ok) setCurrent(null);
                }}>Mark demo as reviewed</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal open={creating} title="Add a demo prescription" description="This stays in the browser and is not sent to a pharmacy." onClose={() => setCreating(false)} wide>
        <ClinicianForm onClose={() => setCreating(false)} />
      </Modal>
      <Modal open={uploading} title="Upload a prescription" description="The file is not uploaded or scanned." onClose={() => setUploading(false)} wide>
        {patientId ? <UploadForm patientId={patientId} onClose={() => setUploading(false)} /> : null}
      </Modal>
    </div>
  );
}

function ClinicianForm({ onClose }: { onClose: () => void }) {
  const { data } = useCare();
  const save = useSave();
  const [patientId, setPatientId] = useState(data?.patients[0]?.id ?? '');
  const [issuedOn, setIssuedOn] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicationFrequency>('once-daily');
  const [instructions, setInstructions] = useState('As written for this demo entry.');
  const [error, setError] = useState('');
  if (!data) return null;
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (name.trim().length < 2 || dosage.trim().length < 1) {
        setError('Enter the medicine name and the dosage as written.');
        return;
      }
      const ok = save(() => createPrescription(data.user.id, patientId, issuedOn, notes, [{
        name, dosage, frequency, instructions, times: defaultTimes(frequency),
      }]), 'Demo prescription saved.');
      if (ok) onClose();
    }}>
      <SelectField label="Patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
        {data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </SelectField>
      <TextField label="Issue date" type="date" value={issuedOn} onChange={(event) => setIssuedOn(event.target.value)} />
      <TextField label="Medicine name" value={name} error={error} onChange={(event) => setName(event.target.value)} />
      <TextField label="Dosage" value={dosage} onChange={(event) => setDosage(event.target.value)} />
      <SelectField label="Frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as MedicationFrequency)}>
        {Object.entries(FREQUENCY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>
      <TextArea label="Instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
      <TextArea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required className="mt-1" />
        I understand this creates a demo record and does not send a prescription to a pharmacy.
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button type="submit">Save demo prescription</Button>
      </div>
    </form>
  );
}

function UploadForm({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const { data } = useCare();
  const save = useSave();
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicationFrequency>('once-daily');
  const [instructions, setInstructions] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [addReminders, setAddReminders] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  if (!data) return null;

  if (step === 1) {
    return (
      <div className="grid gap-3">
        <Notice>Choose a file to practice the review step. The file is not uploaded, read, or scanned.</Notice>
        <label className="text-sm font-semibold text-navy">Document
          <input
            className="mt-1 block w-full text-sm font-normal"
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          />
        </label>
        {fileName ? <p className="text-sm">Selected name: {fileName}</p> : null}
        <div className="flex justify-end">
          <Button disabled={!fileName} onClick={() => setStep(2)}>Continue to review</Button>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (!confirmed || name.trim().length < 2 || !dosage.trim()) {
        setError('Check the details and confirm you reviewed them. The file itself was not read.');
        return;
      }
      const ok = save(() => saveUploadedPrescription(
        data.user.id,
        patientId,
        fileName,
        toISODate(new Date()),
        clinicianName,
        'Saved from the upload demo. The file was not read.',
        [{ name, dosage, frequency, instructions, times: defaultTimes(frequency) }],
        addReminders,
      ), 'Upload saved for demo review. It was not verified.');
      if (ok) onClose();
    }}>
      <Notice tone="warning">Demo mode did not read {fileName}. Replace the sample text with what is actually written on the document before you save.</Notice>
      <Button variant="secondary" onClick={() => {
        setName('Sample-Tablet');
        setDosage('10 mg');
        setFrequency('once-daily');
        setInstructions('Replace this sample text with the instruction printed on the document.');
      }}>Insert sample details</Button>
      <TextField label="Name on the document" value={clinicianName} onChange={(event) => setClinicianName(event.target.value)} />
      <TextField label="Medicine name" value={name} error={error} onChange={(event) => setName(event.target.value)} />
      <TextField label="Dosage" value={dosage} onChange={(event) => setDosage(event.target.value)} />
      <SelectField label="Frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as MedicationFrequency)}>
        {Object.entries(FREQUENCY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>
      <TextArea label="Instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={addReminders} onChange={(event) => setAddReminders(event.target.checked)} />
        Also add a personal reminder. This does not mean a clinician prescribed it.
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        I checked these details. I understand they were not extracted from the file and are not verified.
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
        <Button type="submit">Save for review</Button>
      </div>
    </form>
  );
}

function prescriptionText(item: Prescription, patient: string): string {
  return [
    'Aarogya Loop demo prescription',
    'Not a verified clinical document.',
    `Patient: ${patient}`,
    `Clinician: ${item.clinicianName}`,
    `Issued: ${item.issuedOn}`,
    `Status: ${item.status}`,
    ...item.items.map((entry) => `${entry.name} ${entry.dosage} — ${entry.frequency}. ${entry.instructions}`),
    item.notes,
  ].join('\n');
}

import { Link, useParams } from 'react-router-dom';
import { Badge, EmptyState, Notice, PageHeader, Panel } from '../components/ui/Surface.tsx';
import { useCare } from '../context/CareContext.tsx';
import { ageFrom, formatDate, formatDateTime } from '../utils/dates.ts';
import { isActionableDose } from '../utils/doses.ts';
import { personName } from '../utils/text.ts';

export function PatientRecordPage() {
  const { patientId = '' } = useParams();
  const { data, setActivePatientId } = useCare();
  if (!data) return null;
  const patient = data.patients.find((item) => item.id === patientId);
  if (!patient) {
    return <EmptyState title="This record is not on your panel" body="You can open only the people assigned to you. If this link is wrong, return to the overview." />;
  }
  const medications = data.medications.filter((item) => item.patientId === patient.id && item.status === 'active');
  const appointments = data.appointments.filter((item) => item.patientId === patient.id).slice(0, 4);
  const followUps = data.followUps.filter((item) => item.patientId === patient.id && item.state !== 'completed');
  const open = data.doses.filter((dose) => dose.patientId === patient.id && isActionableDose(dose, new Date())).length;

  return (
    <div className="grid gap-5">
      <PageHeader
        title={patient.name}
        description={`${patient.dateOfBirth ? `${ageFrom(patient.dateOfBirth)} years · ` : ''}${patient.city}. Assigned to you in this demo.`}
        actions={<Link to="/doctor/dashboard" className="text-sm font-semibold text-teal">Back to overview</Link>}
      />
      <Notice>You are viewing {patient.name}. Open reminders: {open}. This screen does not show people outside your panel.</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Active medications">
          <ul className="grid gap-2 text-sm">
            {medications.map((item) => <li key={item.id}>{item.name} · {item.dosage} · {item.source === 'prescribed' ? 'Prescribed entry' : 'Personal reminder'}</li>)}
          </ul>
          <Link className="mt-3 inline-block text-sm font-semibold text-teal" to="/medications" onClick={() => setActivePatientId(patient.id)}>Medication list</Link>
        </Panel>
        <Panel title="Visits">
          <ul className="grid gap-2 text-sm">
            {appointments.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <span>{item.reason} · {formatDateTime(item.startsAt)}</span>
                <Badge>{item.status}</Badge>
              </li>
            ))}
          </ul>
          <Link className="mt-3 inline-block text-sm font-semibold text-teal" to="/appointments" onClick={() => setActivePatientId(patient.id)}>Appointment book</Link>
        </Panel>
        <Panel title="Follow-ups">
          {followUps.length === 0 ? <p className="text-sm text-muted">No open follow-ups.</p> : followUps.map((item) => (
            <p key={item.id} className="text-sm">{item.title} · {item.state} · {formatDate(item.dueOn)} · {personName(data.people, item.clinicianId || item.caregiverId)}</p>
          ))}
        </Panel>
        <Panel title="Records">
          <ul className="grid gap-2 text-sm">
            {data.records.filter((item) => item.patientId === patient.id).map((item) => <li key={item.id}>{item.title}</li>)}
          </ul>
          <Link className="mt-3 inline-block text-sm font-semibold text-teal" to="/health-records" onClick={() => setActivePatientId(patient.id)}>Open documents</Link>
        </Panel>
      </div>
    </div>
  );
}

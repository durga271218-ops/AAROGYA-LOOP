import type {
  ActivityItem,
  AppNotification,
  Appointment,
  Assignment,
  CareLink,
  DemoPatches,
  Dose,
  DoseOverride,
  FollowUp,
  FollowUpState,
  HealthRecord,
  Medication,
  MedicationFrequency,
  Prescription,
  PrescriptionItem,
  RegisterInput,
  User,
  World,
} from '../types/models.ts';
import { addDays, atTime, toISODate } from '../utils/dates.ts';
import { expandDoses, followUpState } from '../utils/doses.ts';
import { FREQUENCY_LABEL } from '../utils/labels.ts';
import { canAccessPatient, canCreateReminder, canRecordDose, scopeWorld, visiblePatientIds } from '../utils/scope.ts';
import { newId } from '../utils/text.ts';
import { API_UNAVAILABLE } from './contract.ts';
import { deriveNotifications } from './notifications.ts';
import { loadPatches, resetPatches, savePatches } from './patches.ts';
import { buildWorld } from './world.ts';
import { defaultPrefs } from '../mocks/seed.ts';

export class CareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CareError';
  }
}

export type AuthResult = { ok: true; user: User } | { ok: false; message: string };

export interface AppData {
  user: User;
  patients: User[];
  people: User[];
  medications: Medication[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  followUps: Array<FollowUp & { state: FollowUpState }>;
  records: HealthRecord[];
  notifications: AppNotification[];
  activity: ActivityItem[];
  links: CareLink[];
  assignments: Assignment[];
  doses: Dose[];
}

export interface PrescriptionDraftItem {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  instructions: string;
  times: string[];
  weekday?: number;
}

export interface AppointmentDraft {
  patientId: string;
  clinicianId?: string;
  clinicianName: string;
  date: string;
  time: string;
  durationMin: number;
  reason: string;
  location: string;
  notes: string;
}

export function dataSource(): 'mock' | 'api' {
  return import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock';
}

function assertMock(): void {
  if (dataSource() === 'api') throw new CareError(API_UNAVAILABLE);
}

function openWorld(): { world: World; patches: DemoPatches } {
  assertMock();
  const patches = loadPatches();
  return { world: buildWorld(new Date(), patches), patches };
}

function requireUser(world: World, userId: string): User {
  const user = world.users.find((person) => person.id === userId);
  if (!user) throw new CareError('That account is not in this browser demo.');
  return user;
}

function assertPatient(user: User, world: World, patientId: string): void {
  if (!canAccessPatient(user, world, patientId)) {
    throw new CareError('You do not have access to this person’s records.');
  }
}

function remember(patches: DemoPatches, activity: ActivityItem): void {
  patches.addedActivity.unshift(activity);
}

export function login(email: string, password: string): AuthResult {
  if (dataSource() === 'api') return { ok: false, message: API_UNAVAILABLE };
  const { world } = openWorld();
  const user = world.users.find((person) => person.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || world.passwords[user.id] !== password) {
    return { ok: false, message: 'Those details do not match an account in this browser demo.' };
  }
  return { ok: true, user };
}

export function registerAccount(input: RegisterInput): AuthResult {
  if (dataSource() === 'api') return { ok: false, message: API_UNAVAILABLE };
  const { world, patches } = openWorld();
  const email = input.email.trim().toLowerCase();
  if (world.users.some((person) => person.email.toLowerCase() === email)) {
    return { ok: false, message: 'An account with that email already exists in this browser.' };
  }
  const prefix = input.role === 'doctor' ? 'd' : input.role === 'caregiver' ? 'c' : 'p';
  const user: User = {
    id: newId(prefix),
    role: input.role,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    city: input.city.trim(),
    dateOfBirth: input.dateOfBirth,
    specialty: input.specialty?.trim(),
    registrationNumber: input.registrationNumber?.trim(),
    relationship: input.relationship?.trim(),
    notificationPrefs: defaultPrefs,
  };
  patches.registeredUsers.push({ ...user, password: input.password });
  savePatches(patches);
  return { ok: true, user };
}

export function getUser(userId: string): User | null {
  if (dataSource() === 'api') return null;
  const { world } = openWorld();
  return world.users.find((person) => person.id === userId) ?? null;
}

export function loadAppData(userId: string, now = new Date()): AppData {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const scoped = scopeWorld(world, user);
  const today = toISODate(now);
  const ids = visiblePatientIds(user, world);
  const doses = expandDoses(
    scoped.medications,
    addDays(today, -14),
    addDays(today, 14),
    now,
    patches.doseOverrides,
  );
  const freshUser = scoped.users.find((person) => person.id === user.id) ?? user;
  return {
    user: freshUser,
    patients: ids
      .map((id) => scoped.users.find((person) => person.id === id))
      .filter((person): person is User => Boolean(person)),
    people: scoped.users,
    medications: scoped.medications,
    appointments: [...scoped.appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    prescriptions: [...scoped.prescriptions].sort((a, b) => b.issuedOn.localeCompare(a.issuedOn)),
    followUps: scoped.followUps
      .map((item) => ({ ...item, state: followUpState(item, today) }))
      .sort((a, b) => a.dueOn.localeCompare(b.dueOn)),
    records: [...scoped.records].sort((a, b) => b.date.localeCompare(a.date)),
    notifications: deriveNotifications(freshUser, scoped, doses, patches.notificationReads, now),
    activity: [...scoped.activity].sort((a, b) => b.at.localeCompare(a.at)),
    links: scoped.careLinks,
    assignments: scoped.assignments,
    doses,
  };
}

export function updateProfile(userId: string, patch: Pick<User, 'name' | 'phone' | 'city'>): void {
  const { patches } = openWorld();
  requireUser(buildWorld(new Date(), patches), userId);
  patches.profileEdits[userId] = { ...patches.profileEdits[userId], ...patch };
  savePatches(patches);
}

export function updatePreferences(userId: string, prefs: User['notificationPrefs']): void {
  const { world, patches } = openWorld();
  requireUser(world, userId);
  patches.profileEdits[userId] = { ...patches.profileEdits[userId], notificationPrefs: prefs };
  savePatches(patches);
}

export function changePassword(userId: string, current: string, next: string): string | null {
  const { world, patches } = openWorld();
  requireUser(world, userId);
  if (world.passwords[userId] !== current) return 'The current password does not match.';
  if (next.length < 8) return 'Use at least 8 characters.';
  if (next === current) return 'Choose a different password.';
  patches.passwordEdits[userId] = next;
  savePatches(patches);
  return null;
}

export function resetDemo(): void {
  assertMock();
  resetPatches();
}

export function setDoseStatus(userId: string, doseId: string, status: DoseOverride['status']): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const [medicationId, date, time] = doseId.split('|');
  const medication = world.medications.find((item) => item.id === medicationId);
  if (!medication || !date || !time) throw new CareError('That reminder could not be found.');
  if (!canRecordDose(user, world, medication.patientId)) {
    throw new CareError('Only the patient or a linked caregiver can record a reminder status.');
  }
  if (atTime(date, time).getTime() > Date.now()) {
    throw new CareError('This reminder is still in the future.');
  }
  patches.doseOverrides[doseId] = { status, recordedAt: new Date().toISOString() };
  const patient = world.users.find((person) => person.id === medication.patientId);
  remember(patches, {
    id: newId('act'),
    patientId: medication.patientId,
    at: new Date().toISOString(),
    title: 'Reminder status recorded',
    detail: `${patient?.name ?? 'Patient'} · ${medication.name} ${medication.dosage} at ${time} marked “${status}”. This does not confirm the dose was taken.`,
    href: '/medications',
  });
  savePatches(patches);
}

export function createReminder(
  userId: string,
  input: Omit<Medication, 'id' | 'source' | 'status' | 'prescriptionId' | 'clinicianId'>,
): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  if (!canCreateReminder(user, world, input.patientId)) {
    throw new CareError('You can add personal reminders only for yourself or a linked patient.');
  }
  const medication: Medication = {
    ...input,
    id: newId('med'),
    source: 'reminder',
    status: 'active',
    instructions: input.instructions || 'Personal reminder. This is not a prescription.',
  };
  patches.addedMedications.push(medication);
  remember(patches, {
    id: newId('act'),
    patientId: input.patientId,
    at: new Date().toISOString(),
    title: 'Personal reminder added',
    detail: `${medication.name} ${medication.dosage} was added as a reminder, not as a prescription.`,
    href: '/medications',
  });
  savePatches(patches);
}

export function updateReminder(userId: string, medicationId: string, patch: Partial<Medication>): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const medication = world.medications.find((item) => item.id === medicationId);
  if (!medication) throw new CareError('That medication could not be found.');
  if (medication.source !== 'reminder' || !canCreateReminder(user, world, medication.patientId)) {
    throw new CareError('Prescribed entries are not edited from the reminder form.');
  }
  patches.medicationEdits[medicationId] = { ...patches.medicationEdits[medicationId], ...patch };
  savePatches(patches);
}

export function discontinueMedication(userId: string, medicationId: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const medication = world.medications.find((item) => item.id === medicationId);
  if (!medication) throw new CareError('That medication could not be found.');
  assertPatient(user, world, medication.patientId);
  const allowed =
    (user.role === 'doctor' && medication.source === 'prescribed') ||
    (user.role !== 'doctor' && medication.source === 'reminder' && canCreateReminder(user, world, medication.patientId));
  if (!allowed) {
    throw new CareError('Only the assigned clinician can discontinue a prescribed entry in this demo.');
  }
  patches.medicationEdits[medicationId] = {
    ...patches.medicationEdits[medicationId],
    status: 'discontinued',
    endDate: toISODate(new Date()),
  };
  savePatches(patches);
}

export function createAppointment(userId: string, draft: AppointmentDraft): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  assertPatient(user, world, draft.patientId);
  if (user.role === 'doctor' && draft.clinicianId !== user.id) {
    throw new CareError('A clinician can record appointments on their own panel.');
  }
  const appointment: Appointment = {
    id: newId('appt'),
    patientId: draft.patientId,
    clinicianId: draft.clinicianId,
    clinicianName: draft.clinicianName.trim(),
    startsAt: atTime(draft.date, draft.time).toISOString(),
    durationMin: draft.durationMin,
    reason: draft.reason.trim(),
    location: draft.location.trim(),
    status: 'upcoming',
    notes: draft.notes.trim(),
  };
  patches.addedAppointments.push(appointment);
  remember(patches, {
    id: newId('act'),
    patientId: draft.patientId,
    at: new Date().toISOString(),
    title: 'Appointment added',
    detail: `${appointment.reason} with ${appointment.clinicianName}.`,
    href: '/appointments',
  });
  savePatches(patches);
}

export function cancelAppointment(userId: string, appointmentId: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const appointment = world.appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new CareError('That appointment could not be found.');
  assertPatient(user, world, appointment.patientId);
  patches.appointmentEdits[appointmentId] = { ...patches.appointmentEdits[appointmentId], status: 'cancelled' };
  savePatches(patches);
}

export function rescheduleAppointment(userId: string, appointmentId: string, date: string, time: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const appointment = world.appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new CareError('That appointment could not be found.');
  assertPatient(user, world, appointment.patientId);
  if (appointment.status === 'cancelled') throw new CareError('Cancelled appointments stay cancelled. Create a new one instead.');
  patches.appointmentEdits[appointmentId] = {
    ...patches.appointmentEdits[appointmentId],
    startsAt: atTime(date, time).toISOString(),
    status: 'upcoming',
    rescheduledFrom: appointment.startsAt,
  };
  savePatches(patches);
}

export function completeAppointment(userId: string, appointmentId: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const appointment = world.appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new CareError('That appointment could not be found.');
  assertPatient(user, world, appointment.patientId);
  patches.appointmentEdits[appointmentId] = { ...patches.appointmentEdits[appointmentId], status: 'completed' };
  savePatches(patches);
}

function itemsFromDraft(items: PrescriptionDraftItem[]): PrescriptionItem[] {
  return items.map((item) => ({
    name: item.name.trim(),
    dosage: item.dosage.trim(),
    frequency: FREQUENCY_LABEL[item.frequency],
    instructions: item.instructions.trim(),
  }));
}

export function createPrescription(
  userId: string,
  patientId: string,
  issuedOn: string,
  notes: string,
  items: PrescriptionDraftItem[],
): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  if (user.role !== 'doctor') throw new CareError('Only a clinician account can add a prescribed entry.');
  assertPatient(user, world, patientId);
  const patient = world.users.find((person) => person.id === patientId);
  const prescription: Prescription = {
    id: newId('rx'),
    patientId,
    clinicianId: user.id,
    clinicianName: user.name,
    issuedOn,
    status: 'active',
    items: itemsFromDraft(items),
    notes: notes.trim() || 'Entered in the demo by the clinician account. Not sent to a pharmacy.',
    source: 'sample-record',
  };
  patches.addedPrescriptions.push(prescription);
  for (const item of items) {
    patches.addedMedications.push({
      id: newId('med'),
      patientId,
      name: item.name.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency,
      times: item.times,
      weekday: item.weekday,
      startDate: issuedOn,
      status: 'active',
      source: 'prescribed',
      clinicianId: user.id,
      prescriptionId: prescription.id,
      instructions: item.instructions.trim() || 'Entered with the demo prescription.',
      notes: '',
    });
  }
  remember(patches, {
    id: newId('act'),
    patientId,
    at: new Date().toISOString(),
    title: 'Demo prescription added',
    detail: `${user.name} added a demo prescription for ${patient?.name ?? 'the patient'}. It was not sent to a pharmacy.`,
    href: '/prescriptions',
  });
  savePatches(patches);
}

export function saveUploadedPrescription(
  userId: string,
  patientId: string,
  fileName: string,
  issuedOn: string,
  clinicianName: string,
  notes: string,
  items: PrescriptionDraftItem[],
  addReminders: boolean,
): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  assertPatient(user, world, patientId);
  if (user.role === 'doctor') {
    throw new CareError('Clinicians add a prescription from the review form instead of the upload demo.');
  }
  const prescription: Prescription = {
    id: newId('rx'),
    patientId,
    clinicianName: clinicianName.trim() || 'Name not entered',
    issuedOn,
    status: 'pending-review',
    items: itemsFromDraft(items),
    notes:
      notes.trim() ||
      'Saved from the upload demo. The file was not read, scanned, or medically verified.',
    source: 'demo-upload',
    fileName,
  };
  patches.addedPrescriptions.push(prescription);
  if (addReminders) {
    for (const item of items) {
      patches.addedMedications.push({
        id: newId('med'),
        patientId,
        name: item.name.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency,
        times: item.times,
        weekday: item.weekday,
        startDate: issuedOn,
        status: 'active',
        source: 'reminder',
        instructions: 'Personal reminder copied from an unverified upload. Not a prescription.',
        notes: `Linked to demo upload ${fileName}.`,
        prescriptionId: prescription.id,
      });
    }
  }
  savePatches(patches);
}

export function reviewPrescription(userId: string, prescriptionId: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const prescription = world.prescriptions.find((item) => item.id === prescriptionId);
  if (!prescription) throw new CareError('That prescription could not be found.');
  if (user.role !== 'doctor') throw new CareError('Only the assigned clinician can mark a demo upload as reviewed.');
  assertPatient(user, world, prescription.patientId);
  patches.prescriptionEdits[prescriptionId] = {
    ...patches.prescriptionEdits[prescriptionId],
    status: 'active',
    notes: `${prescription.notes} Marked reviewed in the demo by ${user.name}. This is not clinical verification.`,
  };
  savePatches(patches);
}

export function createFollowUp(
  userId: string,
  input: Omit<FollowUp, 'id' | 'status' | 'completedOn'>,
): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  assertPatient(user, world, input.patientId);
  patches.addedFollowUps.push({ ...input, id: newId('fu'), status: 'upcoming' });
  savePatches(patches);
}

export function completeFollowUp(userId: string, followUpId: string, note: string): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  const followUp = world.followUps.find((item) => item.id === followUpId);
  if (!followUp) throw new CareError('That follow-up could not be found.');
  assertPatient(user, world, followUp.patientId);
  patches.followUpEdits[followUpId] = {
    ...patches.followUpEdits[followUpId],
    status: 'completed',
    completedOn: toISODate(new Date()),
    notes: note.trim() ? `${followUp.notes} Completion note: ${note.trim()}` : followUp.notes,
  };
  savePatches(patches);
}

export function addHealthRecord(
  userId: string,
  input: Omit<HealthRecord, 'id' | 'summary'> & { summary?: string },
): void {
  const { world, patches } = openWorld();
  const user = requireUser(world, userId);
  assertPatient(user, world, input.patientId);
  patches.addedRecords.unshift({
    id: newId('rec'),
    patientId: input.patientId,
    title: input.title.trim(),
    category: input.category,
    date: input.date,
    source: input.source.trim() || 'Added in the browser demo',
    fileName: input.fileName,
    summary:
      input.summary?.trim() ||
      `File name recorded: ${input.fileName ?? 'none'}. The file itself was not uploaded to a server and was not read.`,
  });
  savePatches(patches);
}

export function markNotificationRead(userId: string, notificationId: string): void {
  const { patches } = openWorld();
  requireUser(buildWorld(new Date(), patches), userId);
  patches.notificationReads[notificationId] = true;
  savePatches(patches);
}

export function markAllNotificationsRead(userId: string): void {
  const data = loadAppData(userId);
  const { patches } = openWorld();
  for (const item of data.notifications) patches.notificationReads[item.id] = true;
  savePatches(patches);
}

export function exportScopedData(userId: string): string {
  const data = loadAppData(userId);
  return JSON.stringify(
    {
      notice: 'Synthetic or user-entered demo data from this browser. Not a clinical export.',
      profile: data.user,
      patients: data.patients,
      medications: data.medications,
      appointments: data.appointments,
      prescriptions: data.prescriptions,
      followUps: data.followUps,
      records: data.records,
    },
    null,
    2,
  );
}

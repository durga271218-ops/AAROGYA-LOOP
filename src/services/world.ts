import {
  activitySeeds,
  appointmentSeeds,
  followUpSeeds,
  medicationSeeds,
  prescriptionSeeds,
  recordSeeds,
  SEED_PASSWORDS,
  seedAssignments,
  seedCareLinks,
  seedUsers,
} from '../mocks/seed.ts';
import type {
  ActivityItem,
  Appointment,
  DemoPatches,
  FollowUp,
  HealthRecord,
  Medication,
  Prescription,
  User,
  World,
} from '../types/models.ts';
import { addDays, atTime, toISODate } from '../utils/dates.ts';
import { emptyPatches } from './patches.ts';

function personName(users: User[], id?: string): string {
  if (!id) return 'Not linked';
  return users.find((person) => person.id === id)?.name ?? 'Not linked';
}

export function buildWorld(now = new Date(), patches: DemoPatches = emptyPatches()): World {
  const today = toISODate(now);
  const passwords: Record<string, string> = { ...SEED_PASSWORDS, ...patches.passwordEdits };
  const users: User[] = seedUsers.map((user) => ({
    ...user,
    ...patches.profileEdits[user.id],
    notificationPrefs: patches.profileEdits[user.id]?.notificationPrefs ?? user.notificationPrefs,
  }));

  for (const registered of patches.registeredUsers) {
    const { password, ...user } = registered;
    const edits = patches.profileEdits[user.id];
    users.push({
      ...user,
      ...edits,
      notificationPrefs: edits?.notificationPrefs ?? user.notificationPrefs,
    });
    passwords[user.id] = patches.passwordEdits[user.id] ?? password;
  }

  const medications: Medication[] = [
    ...medicationSeeds.map((seed) => {
      const medication: Medication = {
        id: seed.id,
        patientId: seed.patientId,
        name: seed.name,
        dosage: seed.dosage,
        frequency: seed.frequency,
        times: seed.times,
        weekday: seed.weekday,
        startDate: addDays(today, seed.startOffset),
        endDate: seed.endOffset === undefined ? undefined : addDays(today, seed.endOffset),
        status: seed.status,
        source: seed.source,
        clinicianId: seed.clinicianId,
        prescriptionId: seed.prescriptionId,
        instructions: seed.instructions,
        notes: seed.notes,
      };
      return { ...medication, ...patches.medicationEdits[seed.id] };
    }),
    ...patches.addedMedications.map((medication) => ({
      ...medication,
      ...patches.medicationEdits[medication.id],
    })),
  ];

  const appointments: Appointment[] = [
    ...appointmentSeeds.map((seed) => {
      const startsAt = atTime(addDays(today, seed.dayOffset), seed.time).toISOString();
      const starts = new Date(startsAt);
      let status = seed.status;
      if (status === 'completed' && starts.getTime() > now.getTime()) status = 'upcoming';
      const appointment: Appointment = {
        id: seed.id,
        patientId: seed.patientId,
        clinicianId: seed.clinicianId,
        clinicianName: personName(users, seed.clinicianId),
        startsAt,
        durationMin: seed.durationMin,
        reason: seed.reason,
        location: seed.location,
        status,
        notes: seed.notes,
      };
      return { ...appointment, ...patches.appointmentEdits[seed.id] };
    }),
    ...patches.addedAppointments.map((appointment) => ({
      ...appointment,
      ...patches.appointmentEdits[appointment.id],
    })),
  ];

  const prescriptions: Prescription[] = [
    ...prescriptionSeeds.map((seed) => {
      const prescription: Prescription = {
        id: seed.id,
        patientId: seed.patientId,
        clinicianId: seed.clinicianId,
        clinicianName: personName(users, seed.clinicianId),
        issuedOn: addDays(today, seed.dayOffset),
        status: seed.status,
        items: seed.items,
        notes: seed.notes,
        source: 'sample-record',
      };
      return { ...prescription, ...patches.prescriptionEdits[seed.id] };
    }),
    ...patches.addedPrescriptions.map((prescription) => ({
      ...prescription,
      ...patches.prescriptionEdits[prescription.id],
    })),
  ];

  const followUps: FollowUp[] = [
    ...followUpSeeds.map((seed) => {
      const followUp: FollowUp = {
        id: seed.id,
        patientId: seed.patientId,
        title: seed.title,
        dueOn: addDays(today, seed.dayOffset),
        status: seed.status,
        clinicianId: seed.clinicianId,
        caregiverId: seed.caregiverId,
        appointmentId: seed.appointmentId,
        prescriptionId: seed.prescriptionId,
        notes: seed.notes,
        nextAction: seed.nextAction,
        completedOn: seed.status === 'completed' ? addDays(today, seed.dayOffset) : undefined,
      };
      return { ...followUp, ...patches.followUpEdits[seed.id] };
    }),
    ...patches.addedFollowUps.map((followUp) => ({
      ...followUp,
      ...patches.followUpEdits[followUp.id],
    })),
  ];

  const records: HealthRecord[] = [
    ...recordSeeds.map((seed) => ({
      id: seed.id,
      patientId: seed.patientId,
      title: seed.title,
      category: seed.category,
      date: addDays(today, seed.dayOffset),
      source: seed.source,
      summary: seed.summary,
    })),
    ...patches.addedRecords,
  ];

  const activity: ActivityItem[] = [
    ...activitySeeds.map((seed) => ({
      id: seed.id,
      patientId: seed.patientId,
      at: atTime(addDays(today, seed.dayOffset), seed.time).toISOString(),
      title: seed.title,
      detail: seed.detail,
      href: seed.href,
    })),
    ...patches.addedActivity,
  ];

  return {
    users,
    medications,
    appointments,
    prescriptions,
    followUps,
    records,
    activity,
    assignments: seedAssignments,
    careLinks: seedCareLinks,
    passwords,
  };
}

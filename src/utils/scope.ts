import type { Role, User, World } from '../types/models.ts';

export function visiblePatientIds(user: User, world: World): string[] {
  if (user.role === 'patient') return [user.id];
  if (user.role === 'doctor') {
    return world.assignments.filter((item) => item.clinicianId === user.id).map((item) => item.patientId);
  }
  return world.careLinks.filter((item) => item.caregiverId === user.id).map((item) => item.patientId);
}

export function canAccessPatient(user: User, world: World, patientId: string): boolean {
  return visiblePatientIds(user, world).includes(patientId);
}

export function canRecordDose(user: User, world: World, patientId: string): boolean {
  if (!canAccessPatient(user, world, patientId)) return false;
  return user.role === 'patient' || user.role === 'caregiver';
}

export function canCreateReminder(user: User, world: World, patientId: string): boolean {
  return canRecordDose(user, world, patientId);
}

export function homeForRole(role: Role): string {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'caregiver') return '/caregiver/dashboard';
  return '/patient/dashboard';
}

export function scopeWorld(world: World, user: User): World {
  const patientIds = new Set(visiblePatientIds(user, world));
  const neededUsers = new Set<string>([user.id, ...patientIds]);

  for (const assignment of world.assignments) {
    if (patientIds.has(assignment.patientId)) neededUsers.add(assignment.clinicianId);
  }
  for (const link of world.careLinks) {
    if (patientIds.has(link.patientId)) {
      neededUsers.add(link.caregiverId);
      neededUsers.add(link.patientId);
    }
  }

  return {
    users: world.users.filter((person) => neededUsers.has(person.id)),
    medications: world.medications.filter((item) => patientIds.has(item.patientId)),
    appointments: world.appointments.filter((item) => patientIds.has(item.patientId)),
    prescriptions: world.prescriptions.filter((item) => patientIds.has(item.patientId)),
    followUps: world.followUps.filter((item) => patientIds.has(item.patientId)),
    records: world.records.filter((item) => patientIds.has(item.patientId)),
    activity: world.activity.filter((item) => patientIds.has(item.patientId)),
    assignments: world.assignments.filter(
      (item) => patientIds.has(item.patientId) && (user.role !== 'doctor' || item.clinicianId === user.id),
    ),
    careLinks: world.careLinks.filter(
      (item) => patientIds.has(item.patientId) && (user.role !== 'caregiver' || item.caregiverId === user.id),
    ),
    passwords: {},
  };
}

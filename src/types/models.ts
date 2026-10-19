export type Role = 'patient' | 'doctor' | 'caregiver';

export interface NotificationPrefs {
  medication: boolean;
  appointment: boolean;
  followUp: boolean;
  browser: boolean;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  city: string;
  dateOfBirth?: string;
  specialty?: string;
  registrationNumber?: string;
  relationship?: string;
  notificationPrefs: NotificationPrefs;
}

export type MedicationStatus = 'active' | 'completed' | 'discontinued';
export type MedicationSource = 'prescribed' | 'reminder';
export type MedicationFrequency =
  | 'once-daily'
  | 'twice-daily'
  | 'three-times-daily'
  | 'weekly'
  | 'as-needed';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  weekday?: number;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  source: MedicationSource;
  clinicianId?: string;
  prescriptionId?: string;
  instructions: string;
  notes: string;
}

export type DoseStatus = 'scheduled' | 'unrecorded' | 'taken' | 'skipped' | 'missed';

export interface Dose {
  id: string;
  medicationId: string;
  patientId: string;
  date: string;
  time: string;
  status: DoseStatus;
  name: string;
  dosage: string;
  source: MedicationSource;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId?: string;
  clinicianName: string;
  startsAt: string;
  durationMin: number;
  reason: string;
  location: string;
  status: AppointmentStatus;
  notes: string;
  rescheduledFrom?: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  clinicianId?: string;
  clinicianName: string;
  issuedOn: string;
  status: 'active' | 'expired' | 'pending-review';
  items: PrescriptionItem[];
  notes: string;
  source: 'sample-record' | 'demo-upload';
  fileName?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  title: string;
  dueOn: string;
  status: 'upcoming' | 'completed';
  clinicianId?: string;
  caregiverId?: string;
  appointmentId?: string;
  prescriptionId?: string;
  notes: string;
  nextAction: string;
  completedOn?: string;
}

export type FollowUpState = 'upcoming' | 'completed' | 'overdue';

export interface HealthRecord {
  id: string;
  patientId: string;
  title: string;
  category: 'visit' | 'prescription' | 'other';
  date: string;
  source: string;
  summary: string;
  fileName?: string;
}

export interface ActivityItem {
  id: string;
  patientId: string;
  at: string;
  title: string;
  detail: string;
  href: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  patientId?: string;
  type: 'medication' | 'appointment' | 'follow-up';
  title: string;
  body: string;
  createdAt: string;
  href: string;
  priority: 'routine' | 'attention';
  read: boolean;
}

export interface Assignment {
  clinicianId: string;
  patientId: string;
}

export interface CareLink {
  caregiverId: string;
  patientId: string;
  relationship: string;
}

export interface World {
  users: User[];
  medications: Medication[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  followUps: FollowUp[];
  records: HealthRecord[];
  activity: ActivityItem[];
  assignments: Assignment[];
  careLinks: CareLink[];
  passwords: Record<string, string>;
}

export interface DoseOverride {
  status: Exclude<DoseStatus, 'scheduled' | 'unrecorded'>;
  recordedAt: string;
}

export interface DemoPatches {
  registeredUsers: Array<User & { password: string }>;
  profileEdits: Record<string, Partial<User>>;
  passwordEdits: Record<string, string>;
  addedMedications: Medication[];
  medicationEdits: Record<string, Partial<Medication>>;
  doseOverrides: Record<string, DoseOverride>;
  addedAppointments: Appointment[];
  appointmentEdits: Record<string, Partial<Appointment>>;
  addedPrescriptions: Prescription[];
  prescriptionEdits: Record<string, Partial<Prescription>>;
  addedFollowUps: FollowUp[];
  followUpEdits: Record<string, Partial<FollowUp>>;
  notificationReads: Record<string, true>;
  addedRecords: HealthRecord[];
  addedActivity: ActivityItem[];
}

export interface RegisterInput {
  role: Role;
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  dateOfBirth?: string;
  specialty?: string;
  registrationNumber?: string;
  relationship?: string;
}

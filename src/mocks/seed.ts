import type {
  AppointmentStatus,
  Assignment,
  CareLink,
  FollowUp,
  HealthRecord,
  MedicationFrequency,
  MedicationSource,
  MedicationStatus,
  NotificationPrefs,
  Prescription,
  User,
} from '../types/models.ts';

export const SAMPLE_LOCATION = 'Sample clinic, Indiranagar, Bengaluru';

export const defaultPrefs: NotificationPrefs = {
  medication: true,
  appointment: true,
  followUp: true,
  browser: false,
};

export const SEED_PASSWORDS: Record<string, string> = {
  'p-aarav': 'demo-patient',
  'p-lakshmi': 'demo-elder',
  'p-rohan': 'demo-hidden',
  'd-ananya': 'demo-doctor',
  'd-vikram': 'demo-hidden',
  'c-priya': 'demo-caregiver',
};

export const DEMO_LOGINS = [
  {
    name: 'Aarav Mehta',
    role: 'Patient',
    email: 'aarav.mehta@demo.aarogyaloop.test',
    password: 'demo-patient',
  },
  {
    name: 'Ananya Shah',
    role: 'Doctor',
    email: 'ananya.shah@demo.aarogyaloop.test',
    password: 'demo-doctor',
  },
  {
    name: 'Priya Mehta',
    role: 'Caregiver',
    email: 'priya.mehta@demo.aarogyaloop.test',
    password: 'demo-caregiver',
  },
  {
    name: 'Lakshmi Nair',
    role: 'Older patient',
    email: 'lakshmi.nair@demo.aarogyaloop.test',
    password: 'demo-elder',
  },
] as const;

const prescribed = 'Recorded on the sample prescription. Aarogya Loop does not change this instruction.';

export const seedUsers: User[] = [
  {
    id: 'p-aarav',
    role: 'patient',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@demo.aarogyaloop.test',
    phone: '+91 99999 10001',
    city: 'Bengaluru',
    dateOfBirth: '1988-04-12',
    notificationPrefs: defaultPrefs,
  },
  {
    id: 'p-lakshmi',
    role: 'patient',
    name: 'Lakshmi Nair',
    email: 'lakshmi.nair@demo.aarogyaloop.test',
    phone: '+91 99999 10002',
    city: 'Bengaluru',
    dateOfBirth: '1949-11-03',
    notificationPrefs: defaultPrefs,
  },
  {
    id: 'p-rohan',
    role: 'patient',
    name: 'Rohan Desai',
    email: 'rohan.desai@demo.aarogyaloop.test',
    phone: '+91 99999 10003',
    city: 'Mysuru',
    dateOfBirth: '1995-06-02',
    notificationPrefs: defaultPrefs,
  },
  {
    id: 'd-ananya',
    role: 'doctor',
    name: 'Ananya Shah',
    email: 'ananya.shah@demo.aarogyaloop.test',
    phone: '+91 99999 10004',
    city: 'Bengaluru',
    specialty: 'General medicine',
    registrationNumber: 'DEMO-REG-20418',
    notificationPrefs: defaultPrefs,
  },
  {
    id: 'd-vikram',
    role: 'doctor',
    name: 'Vikram Rao',
    email: 'vikram.rao@demo.aarogyaloop.test',
    phone: '+91 99999 10005',
    city: 'Mysuru',
    specialty: 'Endocrinology',
    registrationNumber: 'DEMO-REG-11820',
    notificationPrefs: defaultPrefs,
  },
  {
    id: 'c-priya',
    role: 'caregiver',
    name: 'Priya Mehta',
    email: 'priya.mehta@demo.aarogyaloop.test',
    phone: '+91 99999 10006',
    city: 'Bengaluru',
    relationship: 'Daughter',
    notificationPrefs: defaultPrefs,
  },
];

export const seedAssignments: Assignment[] = [
  { clinicianId: 'd-ananya', patientId: 'p-aarav' },
  { clinicianId: 'd-ananya', patientId: 'p-lakshmi' },
  { clinicianId: 'd-vikram', patientId: 'p-rohan' },
];

export const seedCareLinks: CareLink[] = [
  { caregiverId: 'c-priya', patientId: 'p-aarav', relationship: 'Daughter' },
  { caregiverId: 'c-priya', patientId: 'p-lakshmi', relationship: 'Authorized caregiver' },
];

interface MedicationSeed {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  weekday?: number;
  startOffset: number;
  endOffset?: number;
  status: MedicationStatus;
  source: MedicationSource;
  clinicianId?: string;
  prescriptionId?: string;
  instructions: string;
  notes: string;
}

export const medicationSeeds: MedicationSeed[] = [
  {
    id: 'm-amlo',
    patientId: 'p-aarav',
    name: 'Amlodipine',
    dosage: '5 mg',
    frequency: 'once-daily',
    times: ['08:00'],
    startOffset: -40,
    status: 'active',
    source: 'prescribed',
    clinicianId: 'd-ananya',
    prescriptionId: 'rx-aarav-1',
    instructions: prescribed,
    notes: '',
  },
  {
    id: 'm-met',
    patientId: 'p-aarav',
    name: 'Metformin',
    dosage: '500 mg',
    frequency: 'twice-daily',
    times: ['08:00', '20:00'],
    startOffset: -40,
    status: 'active',
    source: 'prescribed',
    clinicianId: 'd-ananya',
    prescriptionId: 'rx-aarav-1',
    instructions: prescribed,
    notes: '',
  },
  {
    id: 'm-vitd',
    patientId: 'p-aarav',
    name: 'Vitamin D',
    dosage: '1000 IU',
    frequency: 'once-daily',
    times: ['09:00'],
    startOffset: -12,
    status: 'active',
    source: 'reminder',
    instructions: 'Personal reminder entered by the patient. This is not a prescription.',
    notes: 'Added in the demo as a user-entered reminder.',
  },
  {
    id: 'm-cet',
    patientId: 'p-aarav',
    name: 'Cetirizine',
    dosage: '10 mg',
    frequency: 'once-daily',
    times: ['21:00'],
    startOffset: -21,
    endOffset: -2,
    status: 'completed',
    source: 'reminder',
    instructions: 'Personal reminder for a short sample course. Not a prescription.',
    notes: 'Sample completed reminder.',
  },
  {
    id: 'm-atorva',
    patientId: 'p-lakshmi',
    name: 'Atorvastatin',
    dosage: '10 mg',
    frequency: 'once-daily',
    times: ['21:00'],
    startOffset: -60,
    status: 'active',
    source: 'prescribed',
    clinicianId: 'd-ananya',
    prescriptionId: 'rx-lakshmi-1',
    instructions: prescribed,
    notes: '',
  },
  {
    id: 'm-amlo-l',
    patientId: 'p-lakshmi',
    name: 'Amlodipine',
    dosage: '5 mg',
    frequency: 'once-daily',
    times: ['08:00'],
    startOffset: -60,
    status: 'active',
    source: 'prescribed',
    clinicianId: 'd-ananya',
    prescriptionId: 'rx-lakshmi-1',
    instructions: prescribed,
    notes: '',
  },
  {
    id: 'm-levo',
    patientId: 'p-rohan',
    name: 'Levothyroxine',
    dosage: '50 mcg',
    frequency: 'once-daily',
    times: ['07:00'],
    startOffset: -90,
    status: 'active',
    source: 'prescribed',
    clinicianId: 'd-vikram',
    prescriptionId: 'rx-rohan-1',
    instructions: prescribed,
    notes: 'This sample patient is on another clinician’s panel.',
  },
];

interface AppointmentSeed {
  id: string;
  patientId: string;
  clinicianId: string;
  dayOffset: number;
  time: string;
  durationMin: number;
  reason: string;
  location: string;
  status: AppointmentStatus;
  notes: string;
}

export const appointmentSeeds: AppointmentSeed[] = [
  {
    id: 'a-aarav-today',
    patientId: 'p-aarav',
    clinicianId: 'd-ananya',
    dayOffset: 0,
    time: '09:30',
    durationMin: 20,
    reason: 'Blood pressure review',
    location: SAMPLE_LOCATION,
    status: 'completed',
    notes: 'Sample visit. No measurements are stored in this demo.',
  },
  {
    id: 'a-aarav-next',
    patientId: 'p-aarav',
    clinicianId: 'd-ananya',
    dayOffset: 1,
    time: '10:30',
    durationMin: 20,
    reason: 'Follow-up conversation',
    location: SAMPLE_LOCATION,
    status: 'upcoming',
    notes: '',
  },
  {
    id: 'a-aarav-past',
    patientId: 'p-aarav',
    clinicianId: 'd-ananya',
    dayOffset: -8,
    time: '11:00',
    durationMin: 15,
    reason: 'Medication list review',
    location: SAMPLE_LOCATION,
    status: 'completed',
    notes: '',
  },
  {
    id: 'a-aarav-later',
    patientId: 'p-aarav',
    clinicianId: 'd-ananya',
    dayOffset: 12,
    time: '16:00',
    durationMin: 20,
    reason: 'Routine review',
    location: SAMPLE_LOCATION,
    status: 'upcoming',
    notes: '',
  },
  {
    id: 'a-lakshmi-today',
    patientId: 'p-lakshmi',
    clinicianId: 'd-ananya',
    dayOffset: 0,
    time: '11:00',
    durationMin: 20,
    reason: 'Morning clinic slot',
    location: SAMPLE_LOCATION,
    status: 'completed',
    notes: '',
  },
  {
    id: 'a-lakshmi-next',
    patientId: 'p-lakshmi',
    clinicianId: 'd-ananya',
    dayOffset: 2,
    time: '15:10',
    durationMin: 30,
    reason: 'Care review',
    location: SAMPLE_LOCATION,
    status: 'upcoming',
    notes: 'Priya Mehta is the authorized caregiver for this sample patient.',
  },
  {
    id: 'a-lakshmi-past',
    patientId: 'p-lakshmi',
    clinicianId: 'd-ananya',
    dayOffset: -3,
    time: '09:15',
    durationMin: 15,
    reason: 'Prescription check',
    location: SAMPLE_LOCATION,
    status: 'completed',
    notes: '',
  },
  {
    id: 'a-rohan-next',
    patientId: 'p-rohan',
    clinicianId: 'd-vikram',
    dayOffset: 4,
    time: '12:00',
    durationMin: 20,
    reason: 'Thyroid review',
    location: 'Sample clinic, Mysuru',
    status: 'upcoming',
    notes: 'Visible only on Vikram Rao’s panel.',
  },
];

interface PrescriptionSeed {
  id: string;
  patientId: string;
  clinicianId: string;
  dayOffset: number;
  status: Prescription['status'];
  items: Prescription['items'];
  notes: string;
}

export const prescriptionSeeds: PrescriptionSeed[] = [
  {
    id: 'rx-aarav-1',
    patientId: 'p-aarav',
    clinicianId: 'd-ananya',
    dayOffset: -40,
    status: 'active',
    items: [
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', instructions: prescribed },
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', instructions: prescribed },
    ],
    notes: 'Sample record typed for the demo. It is not a verified prescription.',
  },
  {
    id: 'rx-lakshmi-1',
    patientId: 'p-lakshmi',
    clinicianId: 'd-ananya',
    dayOffset: -60,
    status: 'active',
    items: [
      { name: 'Atorvastatin', dosage: '10 mg', frequency: 'Once daily in the evening', instructions: prescribed },
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily in the morning', instructions: prescribed },
    ],
    notes: 'Sample record typed for the demo. It is not a verified prescription.',
  },
  {
    id: 'rx-rohan-1',
    patientId: 'p-rohan',
    clinicianId: 'd-vikram',
    dayOffset: -90,
    status: 'active',
    items: [{ name: 'Levothyroxine', dosage: '50 mcg', frequency: 'Once daily', instructions: prescribed }],
    notes: 'Sample record on a different clinician panel.',
  },
];

interface FollowUpSeed {
  id: string;
  patientId: string;
  title: string;
  dayOffset: number;
  status: FollowUp['status'];
  clinicianId?: string;
  caregiverId?: string;
  appointmentId?: string;
  prescriptionId?: string;
  notes: string;
  nextAction: string;
}

export const followUpSeeds: FollowUpSeed[] = [
  {
    id: 'f-aarav-bp',
    patientId: 'p-aarav',
    title: 'Blood pressure follow-up',
    dayOffset: 14,
    status: 'upcoming',
    clinicianId: 'd-ananya',
    appointmentId: 'a-aarav-next',
    prescriptionId: 'rx-aarav-1',
    notes: 'Tied to the sample prescription and the next conversation.',
    nextAction: 'Keep the follow-up visit on the calendar and bring any home notes you already keep.',
  },
  {
    id: 'f-aarav-diet',
    patientId: 'p-aarav',
    title: 'Diet check-in',
    dayOffset: -20,
    status: 'completed',
    clinicianId: 'd-ananya',
    notes: 'Sample completed follow-up.',
    nextAction: 'No further action is recorded.',
  },
  {
    id: 'f-lakshmi-reminders',
    patientId: 'p-lakshmi',
    title: 'Review the morning reminder',
    dayOffset: -1,
    status: 'upcoming',
    caregiverId: 'c-priya',
    clinicianId: 'd-ananya',
    notes: 'The morning reminder has no recorded status in the sample history.',
    nextAction: 'Record whether the reminder was taken, skipped, or missed. That status is not proof the dose was consumed.',
  },
  {
    id: 'f-lakshmi-visit',
    patientId: 'p-lakshmi',
    title: 'Prepare for the care review',
    dayOffset: 2,
    status: 'upcoming',
    clinicianId: 'd-ananya',
    caregiverId: 'c-priya',
    appointmentId: 'a-lakshmi-next',
    notes: 'Linked to the upcoming care review.',
    nextAction: 'Confirm who will attend with Lakshmi Nair.',
  },
  {
    id: 'f-rohan-labs',
    patientId: 'p-rohan',
    title: 'Schedule the next review',
    dayOffset: 7,
    status: 'upcoming',
    clinicianId: 'd-vikram',
    notes: 'Visible only to Vikram Rao and Rohan Desai.',
    nextAction: 'This item stays on Rohan’s own panel.',
  },
];

interface RecordSeed {
  id: string;
  patientId: string;
  title: string;
  category: HealthRecord['category'];
  dayOffset: number;
  source: string;
  summary: string;
}

export const recordSeeds: RecordSeed[] = [
  {
    id: 'rec-aarav-visit',
    patientId: 'p-aarav',
    title: 'Visit note — blood pressure review',
    category: 'visit',
    dayOffset: -8,
    source: 'Sample clinic note',
    summary:
      'Synthetic visit note for Aarav Mehta. Reason recorded: blood pressure review. The note lists the sample prescription and the next conversation. No measurements, diagnoses, or outcomes are included.',
  },
  {
    id: 'rec-aarav-rx',
    patientId: 'p-aarav',
    title: 'Sample prescription list',
    category: 'prescription',
    dayOffset: -40,
    source: 'Typed sample',
    summary:
      'A typed copy of the sample prescription for Amlodipine 5 mg once daily and Metformin 500 mg twice daily. This file was not scanned and has not been medically verified.',
  },
  {
    id: 'rec-lakshmi-visit',
    patientId: 'p-lakshmi',
    title: 'Visit note — prescription check',
    category: 'visit',
    dayOffset: -3,
    source: 'Sample clinic note',
    summary:
      'Synthetic visit note for Lakshmi Nair. Reason recorded: prescription check. It confirms the two sample medicines already on the reminder schedule. No measurements are included.',
  },
  {
    id: 'rec-rohan-visit',
    patientId: 'p-rohan',
    title: 'Visit note — review',
    category: 'visit',
    dayOffset: -15,
    source: 'Sample clinic note',
    summary: 'Synthetic note for Rohan Desai. It is visible only to Rohan and the clinician assigned to him.',
  },
];

interface ActivitySeed {
  id: string;
  patientId: string;
  dayOffset: number;
  time: string;
  title: string;
  detail: string;
  href: string;
}

export const activitySeeds: ActivitySeed[] = [
  {
    id: 'act-aarav-rx',
    patientId: 'p-aarav',
    dayOffset: -40,
    time: '09:00',
    title: 'Sample prescription added',
    detail: 'A typed prescription list was added to Aarav Mehta’s demo chart.',
    href: '/prescriptions',
  },
  {
    id: 'act-aarav-visit',
    patientId: 'p-aarav',
    dayOffset: 0,
    time: '09:30',
    title: 'Morning visit marked completed',
    detail: 'The sample blood pressure review is completed once its time has passed.',
    href: '/appointments',
  },
  {
    id: 'act-lakshmi-link',
    patientId: 'p-lakshmi',
    dayOffset: -2,
    time: '18:00',
    title: 'Caregiver link is active',
    detail: 'Priya Mehta can see Lakshmi Nair’s reminders, visits, and follow-ups in this demo.',
    href: '/caregiver/dashboard',
  },
];


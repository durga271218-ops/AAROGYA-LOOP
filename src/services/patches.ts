import type { DemoPatches } from '../types/models.ts';

const STORAGE_KEY = 'aarogya.demo.patches.v1';

export function emptyPatches(): DemoPatches {
  return {
    registeredUsers: [],
    profileEdits: {},
    passwordEdits: {},
    addedMedications: [],
    medicationEdits: {},
    doseOverrides: {},
    addedAppointments: [],
    appointmentEdits: {},
    addedPrescriptions: [],
    prescriptionEdits: {},
    addedFollowUps: [],
    followUpEdits: {},
    notificationReads: {},
    addedRecords: [],
    addedActivity: [],
  };
}

export function loadPatches(): DemoPatches {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPatches();
    const parsed = JSON.parse(raw) as Partial<DemoPatches>;
    return { ...emptyPatches(), ...parsed };
  } catch {
    return emptyPatches();
  }
}

export function savePatches(patches: DemoPatches): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patches));
}

export function resetPatches(): void {
  localStorage.removeItem(STORAGE_KEY);
}

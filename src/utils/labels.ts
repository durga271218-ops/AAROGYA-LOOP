import type { DoseStatus, MedicationFrequency, MedicationSource } from '../types/models.ts';

export const FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  'once-daily': 'Once daily',
  'twice-daily': 'Twice daily',
  'three-times-daily': 'Three times daily',
  weekly: 'Weekly',
  'as-needed': 'As needed',
};

export const DOSE_LABEL: Record<DoseStatus, string> = {
  scheduled: 'Scheduled',
  unrecorded: 'Not recorded',
  taken: 'Recorded as taken',
  skipped: 'Recorded as skipped',
  missed: 'Recorded as missed',
};

export const SOURCE_LABEL: Record<MedicationSource, string> = {
  prescribed: 'Prescribed entry',
  reminder: 'Personal reminder',
};

export function defaultTimes(frequency: MedicationFrequency): string[] {
  if (frequency === 'twice-daily') return ['08:00', '20:00'];
  if (frequency === 'three-times-daily') return ['08:00', '14:00', '20:00'];
  if (frequency === 'as-needed') return [];
  return ['08:00'];
}

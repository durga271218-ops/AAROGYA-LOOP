import type { Dose, DoseOverride, DoseStatus, FollowUp, FollowUpState, Medication } from '../types/models.ts';
import { addDays, atTime, toISODate } from './dates.ts';

const SEEDED_MEDICATIONS = new Set(['m-amlo', 'm-met', 'm-vitd', 'm-cet', 'm-atorva', 'm-amlo-l', 'm-levo']);

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

export function defaultDoseStatus(medication: Medication, date: string, time: string, now: Date): DoseStatus {
  const slot = atTime(date, time);
  if (slot.getTime() > now.getTime()) return 'scheduled';

  const today = toISODate(now);
  if (date === today || !SEEDED_MEDICATIONS.has(medication.id)) return 'unrecorded';

  if (date === addDays(today, -1) && time === '08:00' && (medication.id === 'm-amlo' || medication.id === 'm-amlo-l')) {
    return 'unrecorded';
  }

  const bucket = hash(`${medication.id}|${date}|${time}`) % 10;
  if (bucket < 7) return 'taken';
  if (bucket < 8) return 'skipped';
  if (bucket === 8) return 'missed';
  return 'unrecorded';
}

export function expandDoses(
  medications: Medication[],
  from: string,
  to: string,
  now: Date,
  overrides: Record<string, DoseOverride> = {},
): Dose[] {
  const doses: Dose[] = [];

  for (const medication of medications) {
    if (medication.frequency === 'as-needed' || medication.times.length === 0) continue;
    if (medication.status === 'discontinued' && !medication.endDate) continue;

    let cursor = medication.startDate > from ? medication.startDate : from;
    const end = medication.endDate && medication.endDate < to ? medication.endDate : to;
    if (cursor > end) continue;

    while (cursor <= end) {
      const include = medication.frequency !== 'weekly' || parseWeekday(cursor) === (medication.weekday ?? 1);
      if (include) {
        for (const time of medication.times) {
          const id = `${medication.id}|${cursor}|${time}`;
          const override = overrides[id];
          doses.push({
            id,
            medicationId: medication.id,
            patientId: medication.patientId,
            date: cursor,
            time,
            status: override?.status ?? defaultDoseStatus(medication, cursor, time, now),
            name: medication.name,
            dosage: medication.dosage,
            source: medication.source,
          });
        }
      }
      cursor = addDays(cursor, 1);
    }
  }

  return doses.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function parseWeekday(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

export interface AdherenceDay {
  date: string;
  label: string;
  taken: number;
  skipped: number;
  missed: number;
  unrecorded: number;
}

export function adherenceSummary(doses: Dose[], from: string, to: string, now: Date) {
  const today = toISODate(now);
  const relevant = doses.filter((dose) => dose.date >= from && dose.date <= to && dose.status !== 'scheduled');
  const days: AdherenceDay[] = [];
  let cursor = from;
  while (cursor <= to && cursor <= today) {
    const dayDoses = relevant.filter((dose) => dose.date === cursor);
    days.push({
      date: cursor,
      label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
        new Date(cursor + 'T00:00:00'),
      ),
      taken: dayDoses.filter((dose) => dose.status === 'taken').length,
      skipped: dayDoses.filter((dose) => dose.status === 'skipped').length,
      missed: dayDoses.filter((dose) => dose.status === 'missed').length,
      unrecorded: dayDoses.filter((dose) => dose.status === 'unrecorded').length,
    });
    cursor = addDays(cursor, 1);
  }

  const taken = relevant.filter((dose) => dose.status === 'taken').length;
  return {
    days,
    taken,
    skipped: relevant.filter((dose) => dose.status === 'skipped').length,
    missed: relevant.filter((dose) => dose.status === 'missed').length,
    unrecorded: relevant.filter((dose) => dose.status === 'unrecorded').length,
    total: relevant.length,
  };
}

export function isActionableDose(dose: Dose, now: Date): boolean {
  if (dose.status !== 'unrecorded') return false;
  return atTime(dose.date, dose.time).getTime() <= now.getTime();
}

export function followUpState(followUp: FollowUp, today: string): FollowUpState {
  if (followUp.status === 'completed') return 'completed';
  return followUp.dueOn < today ? 'overdue' : 'upcoming';
}

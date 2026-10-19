import { describe, expect, it } from 'vitest';
import type { Medication } from '../types/models.ts';
import { addDays, toISODate } from './dates.ts';
import { adherenceSummary, defaultDoseStatus, expandDoses, followUpState, isActionableDose } from './doses.ts';

const now = new Date(2026, 9, 19, 22, 10, 0);

const amlodipine: Medication = {
  id: 'm-amlo',
  patientId: 'p-aarav',
  name: 'Amlodipine',
  dosage: '5 mg',
  frequency: 'once-daily',
  times: ['08:00'],
  startDate: '2026-09-01',
  status: 'active',
  source: 'prescribed',
  instructions: 'Sample',
  notes: '',
};

describe('dose status', () => {
  it('keeps future slots scheduled and leaves today unrecorded', () => {
    const today = toISODate(now);
    expect(defaultDoseStatus(amlodipine, addDays(today, 1), '08:00', now)).toBe('scheduled');
    expect(defaultDoseStatus(amlodipine, today, '08:00', now)).toBe('unrecorded');
  });

  it('lets a saved status replace the sample history', () => {
    const doses = expandDoses([amlodipine], '2026-10-19', '2026-10-19', now, {
      'm-amlo|2026-10-19|08:00': { status: 'taken', recordedAt: now.toISOString() },
    });
    expect(doses[0]?.status).toBe('taken');
    expect(isActionableDose(doses[0]!, now)).toBe(false);
  });

  it('counts only slots whose time has passed', () => {
    const today = toISODate(now);
    const doses = expandDoses([amlodipine], addDays(today, -1), addDays(today, 1), now);
    const summary = adherenceSummary(doses, addDays(today, -1), addDays(today, 1), now);
    expect(summary.total).toBe(2);
    expect(summary.days.some((day) => day.date === addDays(today, 1))).toBe(false);
  });

  it('marks an open follow-up overdue after its due date', () => {
    expect(
      followUpState(
        {
          id: 'f',
          patientId: 'p',
          title: 'Review',
          dueOn: '2026-10-18',
          status: 'upcoming',
          notes: '',
          nextAction: 'Call',
        },
        '2026-10-19',
      ),
    ).toBe('overdue');
  });
});

import { describe, expect, it } from 'vitest';
import { scopeWorld } from '../utils/scope.ts';
import { buildWorld } from './world.ts';

const now = new Date(2026, 9, 19, 22, 10, 0);

describe('demo record scoping', () => {
  const world = buildWorld(now);

  it('shows Ananya Shah only Aarav and Lakshmi', () => {
    const doctor = world.users.find((person) => person.id === 'd-ananya');
    expect(doctor).toBeTruthy();
    const scoped = scopeWorld(world, doctor!);
    const patientIds = scoped.medications.map((item) => item.patientId);
    expect(patientIds).toContain('p-aarav');
    expect(patientIds).toContain('p-lakshmi');
    expect(patientIds).not.toContain('p-rohan');
    expect(scoped.users.some((person) => person.id === 'p-rohan')).toBe(false);
    expect(scoped.passwords).toEqual({});
  });

  it('shows Priya only the two linked patients', () => {
    const caregiver = world.users.find((person) => person.id === 'c-priya');
    const scoped = scopeWorld(world, caregiver!);
    expect(scoped.appointments.every((item) => item.patientId === 'p-aarav' || item.patientId === 'p-lakshmi')).toBe(
      true,
    );
    expect(scoped.records.some((item) => item.patientId === 'p-rohan')).toBe(false);
  });

  it('keeps Rohan on Vikram Rao’s panel only', () => {
    const doctor = world.users.find((person) => person.id === 'd-vikram');
    const scoped = scopeWorld(world, doctor!);
    expect(scoped.medications.every((item) => item.patientId === 'p-rohan')).toBe(true);
    expect(scoped.users.some((person) => person.id === 'p-aarav')).toBe(false);
  });
});

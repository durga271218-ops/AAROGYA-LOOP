import type { AppNotification, Dose, User, World } from '../types/models.ts';
import { addDays, formatDate, formatTime, toISODate } from '../utils/dates.ts';
import { followUpState, isActionableDose } from '../utils/doses.ts';

export function deriveNotifications(
  user: User,
  world: World,
  doses: Dose[],
  reads: Record<string, true>,
  now = new Date(),
): AppNotification[] {
  const today = toISODate(now);
  const soon = addDays(today, 2);
  const followSoon = addDays(today, 3);
  const items: AppNotification[] = [];
  const nameOf = (patientId?: string) => world.users.find((person) => person.id === patientId)?.name ?? 'Patient';

  if (user.notificationPrefs.medication) {
    for (const dose of doses) {
      if (!isActionableDose(dose, now)) continue;
      if (dose.date < addDays(today, -1)) continue;
      const patient = nameOf(dose.patientId);
      const overdue = dose.date < today;
      items.push({
        id: `dose:${dose.id}`,
        userId: user.id,
        patientId: dose.patientId,
        type: 'medication',
        title: overdue ? `${patient}: reminder still open` : `${patient}: reminder needs a status`,
        body: `${dose.name} ${dose.dosage} was scheduled at ${formatTime(dose.time)} on ${formatDate(dose.date)}. Recording a status does not confirm the dose was taken.`,
        createdAt: now.toISOString(),
        href: '/medications',
        priority: 'attention',
        read: false,
      });
    }
  }

  if (user.notificationPrefs.appointment) {
    for (const appointment of world.appointments) {
      const when = toISODate(new Date(appointment.startsAt));
      if (appointment.status !== 'upcoming' || when < today || when > soon) continue;
      const patient = nameOf(appointment.patientId);
      items.push({
        id: `appt:${appointment.id}`,
        userId: user.id,
        patientId: appointment.patientId,
        type: 'appointment',
        title: `${patient}: upcoming appointment`,
        body: `${appointment.reason} with ${appointment.clinicianName} · ${formatDate(when)}.`,
        createdAt: appointment.startsAt,
        href: '/appointments',
        priority: 'routine',
        read: false,
      });
    }
  }

  if (user.notificationPrefs.followUp) {
    for (const followUp of world.followUps) {
      const state = followUpState(followUp, today);
      if (state === 'completed') continue;
      if (state === 'upcoming' && followUp.dueOn > followSoon) continue;
      const patient = nameOf(followUp.patientId);
      items.push({
        id: `fu:${followUp.id}`,
        userId: user.id,
        patientId: followUp.patientId,
        type: 'follow-up',
        title: state === 'overdue' ? `${patient}: follow-up overdue` : `${patient}: follow-up coming up`,
        body: `${followUp.title}. Next action: ${followUp.nextAction}`,
        createdAt: now.toISOString(),
        href: '/follow-ups',
        priority: state === 'overdue' ? 'attention' : 'routine',
        read: false,
      });
    }
  }

  return items
    .map((item) => ({ ...item, read: Boolean(reads[item.id]) }))
    .sort((a, b) => Number(a.read) - Number(b.read) || a.title.localeCompare(b.title));
}

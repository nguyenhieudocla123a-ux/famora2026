/**
 * PHASE 2 — reads sample events. Phase 7 swaps these for
 * GET /api/families/{id}/events?from&to and /events/upcoming (already expanded by the backend).
 */
import { mockEvents } from '../../mocks/data';
import { EventOccurrence, EventType, IsoDate } from '../../shared/types/domain';
import { diffDays } from '../../shared/utils/date';

const byDate = (a: EventOccurrence, b: EventOccurrence) =>
  a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? '');

export function eventsInRange(familyId: string, from: IsoDate, to: IsoDate): EventOccurrence[] {
  return mockEvents.filter(e => e.familyId === familyId && e.date >= from && e.date <= to).sort(byDate);
}

export function eventsOn(familyId: string, date: IsoDate): EventOccurrence[] {
  return eventsInRange(familyId, date, date);
}

export function upcoming(familyId: string, from: IsoDate, days: number, types?: EventType[]): EventOccurrence[] {
  return mockEvents
    .filter(e => e.familyId === familyId)
    .filter(e => {
      const n = diffDays(from, e.date);
      return n >= 0 && n <= days;
    })
    .filter(e => !types || types.includes(e.type))
    .sort(byDate);
}

export function findOccurrence(eventId: string, date: IsoDate): EventOccurrence | undefined {
  return mockEvents.find(e => e.eventId === eventId && e.date === date);
}

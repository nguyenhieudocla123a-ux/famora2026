/**
 * Domain types shared by the screens. They mirror the API response DTOs from
 * docs/phase-1-architecture.md so Phase 7 can swap the mock source for the real API.
 */

export type FamilyRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type EventType =
  | 'BIRTHDAY'
  | 'DEATH_ANNIVERSARY'
  | 'WEDDING_ANNIVERSARY'
  | 'FAMILY_EVENT'
  | 'IMPORTANT_DAY'
  | 'HOLIDAY';

export type CalendarType = 'SOLAR' | 'LUNAR';
export type Recurrence = 'NONE' | 'YEARLY';

/** ISO calendar date, e.g. "2026-11-29". Always a Vietnam-local date, never a timestamp. */
export type IsoDate = string;

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth?: IsoDate;
  avatarUrl?: string;
  /** False for an account that only signs in with Google. */
  hasPassword: boolean;
}

export interface FamilySummary {
  id: string;
  name: string;
  description?: string;
  myRole: FamilyRole;
  memberCount: number;
  memberCanCreateEvents: boolean;
}

export interface FamilyMember {
  id: string;
  userId: string;
  fullName: string;
  nickname?: string;
  role: FamilyRole;
  joinedAt: IsoDate;
}

/** A relative recorded in the family profile; may have no account (e.g. a deceased grandparent). */
export interface FamilyPerson {
  id: string;
  fullName: string;
  nickname?: string;
  isDeceased: boolean;
  deathLunar?: { day: number; month: number };
  memberId?: string;
  /** Next ngay gio from today, computed by the server. */
  nextAnniversary?: IsoDate;
}

/** One concrete occurrence of an event on a solar date (recurring events expand into many), from the server. */
export interface EventOccurrence {
  eventId: string;
  familyId: string;
  title: string;
  type: EventType;
  calendarType: CalendarType;
  recurrence: Recurrence;
  date: IsoDate;
  lunar: LunarDate | null;
  startTime?: string;
  location?: string;
  /** Years since the first occurrence (age, years married); absent when the first year is unknown. */
  anniversary?: number;
}

/** An event itself (its rule), as edited on the detail and form screens. */
export interface EventDetail {
  id: string;
  familyId: string;
  createdBy: string;
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  calendarType: CalendarType;
  solarDate?: IsoDate;
  lunarDay?: number;
  lunarMonth?: number;
  lunarYear?: number;
  lunarLeapMonth: boolean;
  startTime?: string;
  recurrence: Recurrence;
  /** Optimistic lock: sent back on update, a stale one gets 409. */
  version: number;
  personIds: string[];
}

/** One day of the month grid, with its lunar date and holidays, from the server. */
export interface CalendarCell {
  date: IsoDate;
  inMonth: boolean;
  lunar: LunarDate;
  holidays: { name: string; lunar: boolean; publicHoliday: boolean }[];
}

export interface AppNotification {
  id: string;
  /** REMINDER for now; the server may add kinds later. */
  type: string;
  familyId?: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  eventId?: string;
  eventDate?: IsoDate;
}

export interface Invitation {
  id: string;
  code: string;
  role: Exclude<FamilyRole, 'OWNER'>;
  expiresAt: IsoDate;
  maxUses: number;
  usedCount: number;
}

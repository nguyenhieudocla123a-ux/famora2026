import { baseApi } from '../../../shared/api/baseApi';
import type {
  CalendarCell,
  CalendarType,
  EventDetail,
  EventOccurrence,
  EventType,
  IsoDate,
  Recurrence,
} from '../../../shared/types/domain';

/* ---------- server shapes ---------- */

interface CellDto {
  date: string;
  inMonth: boolean;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  lunarLeap: boolean;
  holidays: { name: string; lunar: boolean; publicHoliday: boolean }[];
}

interface MonthDto {
  year: number;
  month: number;
  lunarSubtitle: string;
  cells: CellDto[];
}

interface DayDto {
  date: string;
  lunar: { day: number; month: number; year: number; leap: boolean };
}

interface OccurrenceDto {
  eventId: number;
  date: string;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  lunarLeap: boolean;
  type: EventType;
  title: string;
  location?: string;
  startTime?: string;
  calendarType: CalendarType;
  recurrence: Recurrence;
  anniversary?: number;
}

interface EventDto {
  id: number;
  familyId: number;
  createdBy: number;
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  calendarType: CalendarType;
  solarDate?: string;
  lunarDay?: number;
  lunarMonth?: number;
  lunarYear?: number;
  lunarLeapMonth: boolean;
  startTime?: string;
  recurrence: Recurrence;
  version: number;
  personIds: number[];
}

interface ReminderSettingDto {
  offsets: number[];
  time: string;
}

/* ---------- app shapes ---------- */

export interface MonthView {
  year: number;
  month: number;
  lunarSubtitle: string;
  cells: CalendarCell[];
}

export interface ReminderSetting {
  offsets: number[];
  time: string;
}

export interface ReminderSettings {
  family: ReminderSetting | null;
  mine: ReminderSetting | null;
  effective: ReminderSetting;
}

/** What the create/edit form sends; the server checks the date combination again. */
export interface EventInput {
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  calendarType: CalendarType;
  solarDate?: IsoDate;
  lunarDay?: number;
  lunarMonth?: number;
  lunarYear?: number;
  lunarLeapMonth?: boolean;
  startTime?: string;
  recurrence: Recurrence;
  personIds?: number[];
  version?: number;
}

/** "10:00:00" from Java's LocalTime becomes "10:00". */
const hhmm = (t?: string) => (t ? t.slice(0, 5) : undefined);

export const toCell = (c: CellDto): CalendarCell => ({
  date: c.date,
  inMonth: c.inMonth,
  lunar: { day: c.lunarDay, month: c.lunarMonth, year: c.lunarYear, leap: c.lunarLeap },
  holidays: c.holidays,
});

export const toOccurrence =
  (familyId: string) =>
  (o: OccurrenceDto): EventOccurrence => ({
    eventId: String(o.eventId),
    familyId,
    title: o.title,
    type: o.type,
    calendarType: o.calendarType,
    recurrence: o.recurrence,
    date: o.date,
    lunar: { day: o.lunarDay, month: o.lunarMonth, year: o.lunarYear, leap: o.lunarLeap },
    startTime: hhmm(o.startTime),
    location: o.location,
    anniversary: o.anniversary,
  });

const toEvent = (e: EventDto): EventDetail => ({
  ...e,
  id: String(e.id),
  familyId: String(e.familyId),
  createdBy: String(e.createdBy),
  startTime: hhmm(e.startTime),
  personIds: e.personIds.map(String),
});

/**
 * The calendar: lunar month grids, event occurrences, events and reminder settings. Lunar dates always come
 * from here (the server); the app never converts calendars itself.
 */
export const calendarApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getMonth: build.query<MonthView, { year: number; month: number }>({
      query: params => ({ url: '/api/calendar/month', params }),
      transformResponse: (m: MonthDto): MonthView => ({ ...m, cells: m.cells.map(toCell) }),
      keepUnusedDataFor: 3600, // a month grid never changes
    }),
    convertSolar: build.query<DayDto['lunar'], IsoDate>({
      query: date => ({ url: '/api/calendar/convert', params: { date } }),
      transformResponse: (d: DayDto) => d.lunar,
      keepUnusedDataFor: 3600,
    }),

    getOccurrences: build.query<EventOccurrence[], { familyId: string; from: IsoDate; to: IsoDate }>({
      query: ({ familyId, from, to }) => ({ url: `/api/families/${familyId}/events`, params: { from, to } }),
      transformResponse: (list: OccurrenceDto[], _m, a) => list.map(toOccurrence(a.familyId)),
      providesTags: ['Events'],
    }),
    getUpcoming: build.query<EventOccurrence[], { familyId: string; days: number }>({
      query: ({ familyId, days }) => ({ url: `/api/families/${familyId}/events/upcoming`, params: { days } }),
      transformResponse: (list: OccurrenceDto[], _m, a) => list.map(toOccurrence(a.familyId)),
      providesTags: ['Events'],
    }),
    getEvent: build.query<EventDetail, { familyId: string; eventId: string }>({
      query: ({ familyId, eventId }) => `/api/families/${familyId}/events/${eventId}`,
      transformResponse: toEvent,
      providesTags: (_r, _e, a) => [{ type: 'Events', id: a.eventId }],
    }),
    createEvent: build.mutation<EventDetail, { familyId: string; body: EventInput }>({
      query: ({ familyId, body }) => ({ url: `/api/families/${familyId}/events`, method: 'POST', body }),
      transformResponse: toEvent,
      invalidatesTags: ['Events'],
    }),
    updateEvent: build.mutation<EventDetail, { familyId: string; eventId: string; body: EventInput }>({
      query: ({ familyId, eventId, body }) => ({
        url: `/api/families/${familyId}/events/${eventId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: toEvent,
      invalidatesTags: ['Events', 'Reminders'],
    }),
    deleteEvent: build.mutation<void, { familyId: string; eventId: string }>({
      query: ({ familyId, eventId }) => ({ url: `/api/families/${familyId}/events/${eventId}`, method: 'DELETE' }),
      invalidatesTags: ['Events'],
    }),

    getReminders: build.query<ReminderSettings, { familyId: string; eventId: string }>({
      query: ({ familyId, eventId }) => `/api/families/${familyId}/events/${eventId}/reminders`,
      transformResponse: (r: { family?: ReminderSettingDto; mine?: ReminderSettingDto; effective: ReminderSettingDto }) => ({
        family: r.family ? { offsets: r.family.offsets, time: hhmm(r.family.time)! } : null,
        mine: r.mine ? { offsets: r.mine.offsets, time: hhmm(r.mine.time)! } : null,
        effective: { offsets: r.effective.offsets, time: hhmm(r.effective.time)! },
      }),
      providesTags: (_r, _e, a) => [{ type: 'Reminders', id: a.eventId }],
    }),
    setMyReminders: build.mutation<void, { familyId: string; eventId: string; offsets: number[]; time?: string }>({
      query: ({ familyId, eventId, offsets, time }) => ({
        url: `/api/families/${familyId}/events/${eventId}/reminders/me`,
        method: 'PUT',
        body: { offsets, time },
      }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Reminders', id: a.eventId }],
    }),
    /** The setting for everyone who has not chosen their own; only whoever may edit the event. */
    setFamilyReminders: build.mutation<void, { familyId: string; eventId: string; offsets: number[]; time?: string }>({
      query: ({ familyId, eventId, offsets, time }) => ({
        url: `/api/families/${familyId}/events/${eventId}/reminders/family`,
        method: 'PUT',
        body: { offsets, time },
      }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Reminders', id: a.eventId }],
    }),
  }),
});

export const {
  useGetMonthQuery,
  useConvertSolarQuery,
  useLazyConvertSolarQuery,
  useGetOccurrencesQuery,
  useGetUpcomingQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetRemindersQuery,
  useSetMyRemindersMutation,
  useSetFamilyRemindersMutation,
} = calendarApi;

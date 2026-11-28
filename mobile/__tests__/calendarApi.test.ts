import { toCell, toOccurrence } from '../src/features/calendar/api/calendarApi';

test('an occurrence from the server: ids become strings, "10:00:00" becomes "10:00", lunar date kept', () => {
  const o = toOccurrence('7')({
    eventId: 12,
    date: '2026-11-29',
    lunarDay: 21,
    lunarMonth: 10,
    lunarYear: 2026,
    lunarLeap: false,
    type: 'DEATH_ANNIVERSARY',
    title: 'Giỗ bà nội',
    startTime: '10:00:00',
    calendarType: 'LUNAR',
    recurrence: 'YEARLY',
  });
  expect(o).toMatchObject({
    eventId: '12',
    familyId: '7',
    startTime: '10:00',
    lunar: { day: 21, month: 10, year: 2026, leap: false },
  });
  expect(o.anniversary).toBeUndefined();
});

test('a month cell keeps its lunar date and holidays', () => {
  const c = toCell({
    date: '2027-02-06',
    inMonth: true,
    lunarDay: 1,
    lunarMonth: 1,
    lunarYear: 2027,
    lunarLeap: false,
    holidays: [{ name: 'Tết Nguyên Đán', lunar: true, publicHoliday: true }],
  });
  expect(c.lunar).toEqual({ day: 1, month: 1, year: 2027, leap: false });
  expect(c.holidays[0].publicHoliday).toBe(true);
});

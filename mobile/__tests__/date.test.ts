import {
  addDays,
  daysInMonth,
  diffDays,
  formatLongDate,
  relativeDays,
  weekdayMon0,
} from '../src/shared/utils/date';

describe('date utils (Vietnam calendar dates)', () => {
  test('week starts on Monday', () => {
    expect(weekdayMon0('2026-11-30')).toBe(0); // Monday
    expect(weekdayMon0('2026-11-29')).toBe(6); // Sunday
  });

  test('leap years and month lengths', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  test('adding days crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });

  test('relative labels', () => {
    expect(diffDays('2026-11-26', '2026-11-29')).toBe(3);
    expect(relativeDays('2026-11-26', '2026-11-26')).toBe('Hôm nay');
    expect(relativeDays('2026-11-26', '2026-11-27')).toBe('Ngày mai');
    expect(relativeDays('2026-11-26', '2026-11-29')).toBe('Còn 3 ngày');
    expect(relativeDays('2026-11-26', '2026-11-24')).toBe('2 ngày trước');
  });

  test('long Vietnamese date', () => {
    expect(formatLongDate('2026-11-29')).toBe('Chủ nhật, 29/11/2026');
  });
});

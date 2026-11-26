import { canChiYear, formatLunar, lunarOf } from '../src/mocks/lunarMonths';

/**
 * Guards the Phase 2 sample table. The real conversion (and its full edge-case suite)
 * lives in the backend in Phase 5.
 */
describe('mock lunar table', () => {
  test('Tết Đinh Mùi 2027 is 06/02/2027', () => {
    expect(lunarOf('2027-02-06')).toEqual({ day: 1, month: 1, year: 2027, leap: false });
    expect(lunarOf('2027-02-05')).toEqual({ day: 29, month: 12, year: 2026, leap: false });
  });

  test('sample death anniversaries fall on the right lunar day', () => {
    expect(formatLunar(lunarOf('2026-11-29')!)).toBe('21/10 âm'); // giỗ bà nội
    expect(formatLunar(lunarOf('2027-01-15')!)).toBe('8/12 âm'); // giỗ ông nội
    expect(lunarOf('2026-11-23')?.day).toBe(15); // rằm tháng Mười
  });

  test('lunar months of 29 and 30 days', () => {
    expect(lunarOf('2026-12-08')).toMatchObject({ day: 30, month: 10 }); // tháng Mười đủ
    expect(lunarOf('2027-01-07')).toMatchObject({ day: 30, month: 11 });
  });

  test('outside the table there is no lunar date', () => {
    expect(lunarOf('2026-07-01')).toBeNull();
    expect(lunarOf('2027-05-01')).toBeNull();
  });

  test('can chi year names', () => {
    expect(canChiYear(2026)).toBe('Bính Ngọ');
    expect(canChiYear(2027)).toBe('Đinh Mùi');
    expect(canChiYear(2025)).toBe('Ất Tỵ');
  });
});

import { canChiDay, canChiMonth, canChiYear, julianDay } from '../src/shared/utils/canChi';
import { moodOf } from '../src/shared/theme/moods';

describe('can chi', () => {
  test('Julian day number', () => {
    expect(julianDay('2000-01-01')).toBe(2451545);
  });

  test('1/1/2000 was a Mậu Ngọ day', () => {
    expect(canChiDay('2000-01-01')).toBe('Mậu Ngọ');
  });

  test('consecutive days advance one step in both cycles', () => {
    expect(canChiDay('2000-01-02')).toBe('Kỷ Mùi');
  });

  test('months of a Bính year start at Canh Dần', () => {
    expect(canChiMonth(1, 2026)).toBe('Canh Dần');
    expect(canChiMonth(10, 2026)).toBe('Kỷ Hợi');
  });

  test('years', () => {
    expect(canChiYear(2026)).toBe('Bính Ngọ');
    expect(canChiYear(2027)).toBe('Đinh Mùi');
  });
});

describe('day mood', () => {
  test('giỗ outranks everything, then lễ, cưới, sinh nhật', () => {
    expect(moodOf(['BIRTHDAY', 'DEATH_ANNIVERSARY'])).toBe('memorial');
    expect(moodOf(['BIRTHDAY', 'HOLIDAY'])).toBe('holiday');
    expect(moodOf(['BIRTHDAY'])).toBe('birthday');
    expect(moodOf(['FAMILY_EVENT'])).toBe('ordinary');
    expect(moodOf([])).toBe('ordinary');
  });
});

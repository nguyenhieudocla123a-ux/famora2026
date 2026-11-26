/**
 * PHASE 2 MOCK — removed in Phase 7.
 *
 * The app never computes the lunar calendar itself: the backend is the single source of
 * truth (GET /api/calendar/lunar-month). Until that API exists, this table lists the first
 * solar day of each lunar month for Jul 2026 – Apr 2027. It was generated with a prototype of
 * Ho Ngoc Duc's algorithm (UTC+7) that was checked against Vietnamese Tet dates 1968–2027
 * and the leap months of 2020, 2023 and 2025. The calendar only navigates inside this range.
 */
import { IsoDate, LunarDate } from '../shared/types/domain';
import { diffDays } from '../shared/utils/date';

interface LunarMonthStart {
  solar: IsoDate;
  month: number;
  year: number;
  leap: boolean;
}

const MONTH_STARTS: LunarMonthStart[] = [
  { solar: '2026-07-14', month: 6, year: 2026, leap: false },
  { solar: '2026-08-13', month: 7, year: 2026, leap: false },
  { solar: '2026-09-11', month: 8, year: 2026, leap: false },
  { solar: '2026-10-10', month: 9, year: 2026, leap: false },
  { solar: '2026-11-09', month: 10, year: 2026, leap: false },
  { solar: '2026-12-09', month: 11, year: 2026, leap: false },
  { solar: '2027-01-08', month: 12, year: 2026, leap: false },
  { solar: '2027-02-06', month: 1, year: 2027, leap: false },
  { solar: '2027-03-08', month: 2, year: 2027, leap: false },
  { solar: '2027-04-07', month: 3, year: 2027, leap: false },
];

/** First and last solar month the mock calendar can show. */
export const MOCK_RANGE = { first: { y: 2026, m: 8 }, last: { y: 2027, m: 3 } };

export function lunarOf(iso: IsoDate): LunarDate | null {
  const last = MONTH_STARTS[MONTH_STARTS.length - 1];
  if (diffDays(last.solar, iso) >= 0) {
    return null; // past the table
  }
  for (let i = MONTH_STARTS.length - 2; i >= 0; i--) {
    const start = MONTH_STARTS[i];
    const offset = diffDays(start.solar, iso);
    if (offset >= 0) {
      return { day: offset + 1, month: start.month, year: start.year, leap: start.leap };
    }
  }
  return null;
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const MONTH_NAMES = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];

/** "Bính Ngọ" */
export function canChiYear(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

/** "tháng Mười" / "tháng Hai nhuận" */
export function lunarMonthName(month: number, leap: boolean): string {
  return `tháng ${MONTH_NAMES[month - 1]}${leap ? ' nhuận' : ''}`;
}

/** "21/10 âm" */
export function formatLunar(l: LunarDate): string {
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} âm`;
}

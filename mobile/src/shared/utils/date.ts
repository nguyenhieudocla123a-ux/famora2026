import { IsoDate } from '../types/domain';

/**
 * Calendar-date helpers. Dates are plain Y-M-D values in Vietnam time (UTC+7, no DST),
 * so the device time zone can never shift a day.
 */

export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number;
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function todayVn(): IsoDate {
  const now = new Date(Date.now() + VN_OFFSET_MS);
  return toIso({ y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() });
}

export function parseIso(iso: IsoDate): Ymd {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

export function toIso({ y, m, d }: Ymd): IsoDate {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = Monday ... 6 = Sunday (Vietnamese calendars start the week on Monday). */
export function weekdayMon0(iso: IsoDate): number {
  const { y, m, d } = parseIso(iso);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const { y, m, d } = parseIso(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toIso({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  const a = parseIso(from);
  const b = parseIso(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

const WEEKDAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function weekdayName(iso: IsoDate): string {
  return WEEKDAYS[weekdayMon0(iso)];
}

/** "29/11/2026" */
export function formatDate(iso: IsoDate): string {
  const { y, m, d } = parseIso(iso);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** "29/11" */
export function formatDayMonth(iso: IsoDate): string {
  const { m, d } = parseIso(iso);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** "Chủ nhật, 29/11/2026" */
export function formatLongDate(iso: IsoDate): string {
  return `${weekdayName(iso)}, ${formatDate(iso)}`;
}

/** "Hôm nay", "Ngày mai", "Còn 3 ngày", "2 ngày trước" */
export function relativeDays(from: IsoDate, to: IsoDate): string {
  const n = diffDays(from, to);
  if (n === 0) {
    return 'Hôm nay';
  }
  if (n === 1) {
    return 'Ngày mai';
  }
  if (n > 1) {
    return `Còn ${n} ngày`;
  }
  return `${-n} ngày trước`;
}

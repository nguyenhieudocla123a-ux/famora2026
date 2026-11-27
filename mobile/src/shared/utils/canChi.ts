import { IsoDate } from '../types/domain';
import { parseIso } from './date';

/**
 * Can chi (sexagenary) names as printed on Vietnamese tear-off calendars.
 * Formulas from Hồ Ngọc Đức's lunar calendar notes:
 *   day:   can = (JDN + 9) mod 10, chi = (JDN + 1) mod 12
 *   month: chi = (lunarMonth + 1) mod 12, can = (lunarYear * 12 + lunarMonth + 3) mod 10
 *   year:  can = (year + 6) mod 10, chi = (year + 8) mod 12
 * The lunar month/year come from the backend's conversion; only the arithmetic lives here.
 */
const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/** Julian day number of a Gregorian date. */
export function julianDay(iso: IsoDate): number {
  const { y, m, d } = parseIso(iso);
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export function canChiDay(iso: IsoDate): string {
  const jd = julianDay(iso);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}

export function canChiMonth(lunarMonth: number, lunarYear: number): string {
  return `${CAN[(lunarYear * 12 + lunarMonth + 3) % 10]} ${CHI[(lunarMonth + 1) % 12]}`;
}

export function canChiYear(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

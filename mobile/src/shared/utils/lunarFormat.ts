import { LunarDate } from '../types/domain';

/**
 * Display helpers for lunar dates. The dates themselves always come from the backend (the one source of
 * lunar truth); these only turn them into words.
 */
const MONTH_NAMES = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Một', 'Chạp'];

/** "tháng Mười" / "tháng Hai nhuận" */
export function lunarMonthName(month: number, leap: boolean): string {
  return `tháng ${MONTH_NAMES[month - 1]}${leap ? ' nhuận' : ''}`;
}

/** "21/10 âm" */
export function formatLunar(l: Pick<LunarDate, 'day' | 'month' | 'leap'>): string {
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} âm`;
}

import { useCallback, useMemo } from 'react';
import type { CalendarCell, IsoDate, LunarDate } from '../../shared/types/domain';
import { parseIso } from '../../shared/utils/date';
import { useGetMonthQuery } from './api/calendarApi';

/**
 * Lunar dates for the month of {@code anchor} and the month after, fetched from the server (two small,
 * long-cached month grids). Enough for the tear-off sheet: as the anchor moves, the next months load.
 */
export function useLunarDays(anchor: IsoDate) {
  const { y, m } = parseIso(anchor);
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const a = useGetMonthQuery({ year: y, month: m });
  const b = useGetMonthQuery({ year: next.y, month: next.m });

  const byDate = useMemo(() => {
    const map = new Map<IsoDate, CalendarCell>();
    for (const cell of [...(a.data?.cells ?? []), ...(b.data?.cells ?? [])]) {
      map.set(cell.date, cell);
    }
    return map;
  }, [a.data, b.data]);

  const lunarOf = useCallback((date: IsoDate): LunarDate | null => byDate.get(date)?.lunar ?? null, [byDate]);
  const holidaysOf = useCallback((date: IsoDate) => byDate.get(date)?.holidays ?? [], [byDate]);

  return { lunarOf, holidaysOf };
}

package com.famora.calendar.occurrence;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.Recurrence;
import com.famora.calendar.lunar.LunarCalendar;
import com.famora.calendar.lunar.LunarDate;

/**
 * Expands an event's rule into the solar dates it falls on inside [from, to]. Pure Java, no Spring.
 * <p>
 * Policies agreed in the Phase 1 design:
 * <ul>
 * <li>Yearly solar on 29 February: 28 February in years without it.</li>
 * <li>Yearly lunar on day 30: the last day (29th) in years where that month is short.</li>
 * <li>Yearly lunar whose origin was in a leap month: kept every year in the ordinary month.</li>
 * <li>Lunar months 11 and 12 fall in the next solar year, so ranges are walked by lunar year, never by
 * "solar year = lunar year".</li>
 * </ul>
 */
public final class OccurrenceCalculator {

    private OccurrenceCalculator() {
    }

    /**
     * An event's date rule.
     *
     * @param solarDate  the original solar date (for LUNAR: the solar date of the lunar date, when its year is known)
     * @param lunarYear  null when a yearly lunar event's first year is unknown
     */
    public record Rule(CalendarType calendarType, Recurrence recurrence, LocalDate solarDate, Integer lunarDay,
            Integer lunarMonth, Integer lunarYear, boolean lunarLeap) {
    }

    /**
     * @param anniversary how many years since the original date (0 = the original itself); null when unknown
     */
    public record Occurrence(LocalDate date, Integer anniversary) {
    }

    public static List<Occurrence> expand(Rule rule, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            return List.of();
        }
        if (rule.recurrence() == Recurrence.NONE) {
            LocalDate d = rule.solarDate();
            return d != null && !d.isBefore(from) && !d.isAfter(to) ? List.of(new Occurrence(d, 0)) : List.of();
        }
        return rule.calendarType() == CalendarType.SOLAR ? yearlySolar(rule, from, to) : yearlyLunar(rule, from, to);
    }

    private static List<Occurrence> yearlySolar(Rule rule, LocalDate from, LocalDate to) {
        LocalDate origin = rule.solarDate();
        List<Occurrence> out = new ArrayList<>();
        for (int y = Math.max(from.getYear(), origin.getYear()); y <= to.getYear(); y++) {
            LocalDate d = origin.withYear(y); // 29 Feb becomes 28 Feb in common years
            if (!d.isBefore(from) && !d.isAfter(to)) {
                out.add(new Occurrence(d, y - origin.getYear()));
            }
        }
        return out;
    }

    private static List<Occurrence> yearlyLunar(Rule rule, LocalDate from, LocalDate to) {
        int firstLunarYear = LunarCalendar.toLunar(from).year();
        int lastLunarYear = LunarCalendar.toLunar(to).year();
        List<Occurrence> out = new ArrayList<>();
        for (int ly = firstLunarYear; ly <= lastLunarYear; ly++) {
            if (rule.lunarYear() != null && ly < rule.lunarYear()) {
                continue;
            }
            int month = rule.lunarMonth();
            int length = LunarCalendar.monthLength(month, ly, false).orElseThrow();
            int day = Math.min(rule.lunarDay(), length); // day 30 of a short month: the 29th
            LocalDate d = LunarCalendar.toSolar(new LunarDate(day, month, ly, false)).orElseThrow();
            if (!d.isBefore(from) && !d.isAfter(to)) {
                out.add(new Occurrence(d, rule.lunarYear() == null ? null : ly - rule.lunarYear()));
            }
        }
        return out;
    }
}

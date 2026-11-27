package com.famora.calendar.lunar;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Vietnamese lunar calendar, after the astronomical algorithm published by Hồ Ngọc Đức, computed for
 * Vietnam's time zone (UTC+7). Pure Java, no Spring, no state: every answer depends only on its input.
 * <p>
 * Why not a Chinese calendar library: those compute new moons for UTC+8 (Beijing). When a new moon falls
 * between 23:00 and 24:00 Hanoi time, the month starts a day earlier in Vietnam: Tết 1968 was on 29 Jan in
 * Vietnam but 30 Jan in China; Tết 1985 was 21 Jan in Vietnam, 20 Feb in China.
 * <p>
 * Supported range: solar years 1900 to 2100.
 */
public final class LunarCalendar {

    /** Vietnam: UTC+7, in hours. */
    private static final double TIME_ZONE = 7.0;
    private static final double SYNODIC_MONTH = 29.530588853;
    /** Julian day of the new moon of 1 January 1900, the reference for counting lunations. */
    private static final double NEW_MOON_1900 = 2415021.076998695;
    /** Julian day number of 1970-01-01, so LocalDate.toEpochDay() converts in one addition. */
    private static final long EPOCH_JDN = 2440588;

    public static final int MIN_YEAR = 1900;
    public static final int MAX_YEAR = 2100;

    private LunarCalendar() {
    }

    // ---------------------------------------------------------------- public API

    public static LunarDate toLunar(LocalDate solar) {
        checkRange(solar.getYear());
        long dayNumber = jdn(solar);
        long k = (long) Math.floor((dayNumber - NEW_MOON_1900) / SYNODIC_MONTH);
        long monthStart = newMoonDay(k + 1);
        // The published algorithm steps back once. Near midnight (UTC+7) the estimate of k can be one too
        // high, which made 2054-05-07 and 2062-04-09 come out as "day 0": keep stepping back instead.
        while (monthStart > dayNumber) {
            k--;
            monthStart = newMoonDay(k + 1);
        }
        int yy = solar.getYear();
        long a11 = lunarMonth11(yy);
        long b11 = a11;
        int lunarYear;
        if (a11 >= monthStart) {
            lunarYear = yy;
            a11 = lunarMonth11(yy - 1);
        } else {
            lunarYear = yy + 1;
            b11 = lunarMonth11(yy + 1);
        }
        int lunarDay = (int) (dayNumber - monthStart + 1);
        int diff = (int) Math.floor((monthStart - a11) / 29.0);
        boolean leap = false;
        int lunarMonth = diff + 11;
        if (b11 - a11 > 365) {
            int leapMonthDiff = leapMonthOffset(a11);
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10;
                if (diff == leapMonthDiff) {
                    leap = true;
                }
            }
        }
        if (lunarMonth > 12) {
            lunarMonth -= 12;
        }
        if (lunarMonth >= 11 && diff < 4) {
            lunarYear -= 1;
        }
        return new LunarDate(lunarDay, lunarMonth, lunarYear, leap);
    }

    /**
     * The solar date of a lunar date, or empty when that lunar date does not exist: a leap month the year
     * does not have, or day 30 of a 29-day month.
     */
    public static Optional<LocalDate> toSolar(LunarDate lunar) {
        return monthStart(lunar.month(), lunar.year(), lunar.leap())
                .filter(m -> lunar.day() <= m.length())
                .map(m -> m.start().plusDays(lunar.day() - 1L));
    }

    /** 29 or 30; empty if the month does not exist (e.g. a leap month the year does not have). */
    public static Optional<Integer> monthLength(int month, int lunarYear, boolean leap) {
        return monthStart(month, lunarYear, leap).map(MonthSpan::length);
    }

    /** The repeated month of a lunar year, if it has one (about 7 years in 19 do). */
    public static Optional<Integer> leapMonthOf(int lunarYear) {
        for (int month = 1; month <= 12; month++) {
            if (monthStart(month, lunarYear, true).isPresent()) {
                return Optional.of(month);
            }
        }
        return Optional.empty();
    }

    // ---------------------------------------------------------------- the algorithm

    private record MonthSpan(LocalDate start, int length) {
    }

    private static Optional<MonthSpan> monthStart(int lunarMonth, int lunarYear, boolean leap) {
        checkRange(lunarYear);
        long a11;
        long b11;
        if (lunarMonth < 11) {
            a11 = lunarMonth11(lunarYear - 1);
            b11 = lunarMonth11(lunarYear);
        } else {
            a11 = lunarMonth11(lunarYear);
            b11 = lunarMonth11(lunarYear + 1);
        }
        long k = (long) Math.floor(0.5 + (a11 - NEW_MOON_1900) / SYNODIC_MONTH);
        int off = lunarMonth - 11;
        if (off < 0) {
            off += 12;
        }
        if (b11 - a11 > 365) {
            int leapOff = leapMonthOffset(a11);
            int leapMonth = leapOff - 2;
            if (leapMonth < 0) {
                leapMonth += 12;
            }
            if (leap && lunarMonth != leapMonth) {
                return Optional.empty();
            }
            if (leap || off >= leapOff) {
                off += 1;
            }
        } else if (leap) {
            return Optional.empty();
        }
        long start = newMoonDay(k + off);
        long next = newMoonDay(k + off + 1);
        return Optional.of(new MonthSpan(fromJdn(start), (int) (next - start)));
    }

    /** The day (Julian day number, Vietnam time) on which the k-th new moon after 1900-01-01 falls. */
    static long newMoonDay(long k) {
        return (long) Math.floor(newMoon(k) + 0.5 + TIME_ZONE / 24.0);
    }

    /** Julian day (UT) of the k-th new moon after 1900-01-01; Meeus, "Astronomical Algorithms", ch. 49. */
    private static double newMoon(long k) {
        double t = k / 1236.85;
        double t2 = t * t;
        double t3 = t2 * t;
        double dr = Math.PI / 180;
        double jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
        jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
        double m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3; // sun's mean anomaly
        double mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3; // moon's mean anomaly
        double f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3; // moon's argument of latitude
        double c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * dr * m);
        c1 = c1 - 0.4068 * Math.sin(mpr * dr) + 0.0161 * Math.sin(dr * 2 * mpr);
        c1 = c1 - 0.0004 * Math.sin(dr * 3 * mpr);
        c1 = c1 + 0.0104 * Math.sin(dr * 2 * f) - 0.0051 * Math.sin(dr * (m + mpr));
        c1 = c1 - 0.0074 * Math.sin(dr * (m - mpr)) + 0.0004 * Math.sin(dr * (2 * f + m));
        c1 = c1 - 0.0004 * Math.sin(dr * (2 * f - m)) - 0.0006 * Math.sin(dr * (2 * f + mpr));
        c1 = c1 + 0.0010 * Math.sin(dr * (2 * f - mpr)) + 0.0005 * Math.sin(dr * (2 * mpr + m));
        double deltaT;
        if (t < -11) {
            deltaT = 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3;
        } else {
            deltaT = -0.000278 + 0.000265 * t + 0.000262 * t2;
        }
        return jd1 + c1 - deltaT;
    }

    /** Sun's apparent longitude (radians, 0 to 2π) at Julian day {@code jdn}. */
    private static double sunLongitude(double jdn) {
        double t = (jdn - 2451545.0) / 36525;
        double t2 = t * t;
        double dr = Math.PI / 180;
        double m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
        double l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
        double dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
        dl = dl + (0.019993 - 0.000101 * t) * Math.sin(dr * 2 * m) + 0.000290 * Math.sin(dr * 3 * m);
        double l = (l0 + dl) * dr;
        return l - Math.PI * 2 * Math.floor(l / (Math.PI * 2));
    }

    /** Which of the 12 thirty-degree sectors the sun is in at the start of a day (Vietnam time). */
    private static int sunSector(long dayNumber) {
        return (int) Math.floor(sunLongitude(dayNumber - 0.5 - TIME_ZONE / 24.0) / Math.PI * 6);
    }

    /** The first day of lunar month 11 (the month holding the winter solstice) of solar year {@code yy}. */
    private static long lunarMonth11(int yy) {
        long off = jdn(LocalDate.of(yy, 12, 31)) - 2415021;
        long k = (long) Math.floor(off / SYNODIC_MONTH);
        long nm = newMoonDay(k);
        if (sunSector(nm) >= 9) {
            nm = newMoonDay(k - 1);
        }
        return nm;
    }

    /** In a 13-month year, the leap month is the first one in which the sun enters no new sector. */
    private static int leapMonthOffset(long a11) {
        long k = (long) Math.floor((a11 - NEW_MOON_1900) / SYNODIC_MONTH + 0.5);
        int last;
        int i = 1;
        int arc = sunSector(newMoonDay(k + i));
        do {
            last = arc;
            i++;
            arc = sunSector(newMoonDay(k + i));
        } while (arc != last && i < 14);
        return i - 1;
    }

    private static long jdn(LocalDate date) {
        return date.toEpochDay() + EPOCH_JDN;
    }

    private static LocalDate fromJdn(long jdn) {
        return LocalDate.ofEpochDay(jdn - EPOCH_JDN);
    }

    private static void checkRange(int year) {
        if (year < MIN_YEAR || year > MAX_YEAR) {
            throw new IllegalArgumentException("Chỉ hỗ trợ năm " + MIN_YEAR + " đến " + MAX_YEAR);
        }
    }
}

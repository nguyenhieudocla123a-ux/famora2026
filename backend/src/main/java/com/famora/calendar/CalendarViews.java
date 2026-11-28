package com.famora.calendar;

import java.time.LocalDate;
import java.util.List;

/** Response shapes of /api/calendar. */
public final class CalendarViews {

    private CalendarViews() {
    }

    public record Lunar(int day, int month, int year, boolean leap, String monthName, String canChiMonth,
            String canChiYear) {
    }

    public record HolidayView(String name, boolean lunar, boolean publicHoliday) {
    }

    /** Everything about one day: the answer of /convert. */
    public record Day(LocalDate date, int weekday, Lunar lunar, String canChiDay, List<HolidayView> holidays) {
    }

    /** One cell of the month grid. {@code inMonth} is false for the leading/trailing days of other months. */
    public record Cell(LocalDate date, boolean inMonth, int lunarDay, int lunarMonth, int lunarYear,
            boolean lunarLeap, List<HolidayView> holidays) {
    }

    /** 42 cells (6 weeks, Monday first) plus the lunar months the solar month spans. */
    public record Month(int year, int month, String lunarSubtitle, List<Cell> cells) {
    }
}

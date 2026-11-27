package com.famora.calendar;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Lunar conversions and the month grid. Signed-in users only, like the rest of the API. */
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendar;

    public CalendarController(CalendarService calendar) {
        this.calendar = calendar;
    }

    /** GET /api/calendar/convert?date=2026-11-27 */
    @GetMapping(value = "/convert", params = "date")
    public CalendarViews.Day fromSolar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return calendar.fromSolar(date);
    }

    /** GET /api/calendar/convert?lunarDay=21&amp;lunarMonth=10&amp;lunarYear=2026&amp;leap=false */
    @GetMapping(value = "/convert", params = {"lunarDay", "lunarMonth", "lunarYear"})
    public CalendarViews.Day fromLunar(@RequestParam int lunarDay, @RequestParam int lunarMonth,
            @RequestParam int lunarYear, @RequestParam(defaultValue = "false") boolean leap) {
        return calendar.fromLunar(lunarDay, lunarMonth, lunarYear, leap);
    }

    /** GET /api/calendar/month?year=2026&amp;month=11: 42 cells, Monday first. */
    @GetMapping("/month")
    public CalendarViews.Month month(@RequestParam int year, @RequestParam int month) {
        return calendar.month(year, month);
    }
}

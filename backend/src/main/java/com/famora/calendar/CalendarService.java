package com.famora.calendar;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.famora.calendar.CalendarViews.Cell;
import com.famora.calendar.CalendarViews.Day;
import com.famora.calendar.CalendarViews.HolidayView;
import com.famora.calendar.CalendarViews.Lunar;
import com.famora.calendar.CalendarViews.Month;
import com.famora.calendar.lunar.CanChi;
import com.famora.calendar.lunar.Holidays;
import com.famora.calendar.lunar.LunarCalendar;
import com.famora.calendar.lunar.LunarDate;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

/** Turns the pure lunar engine into the views the app shows. The backend is the one source of lunar truth. */
@Service
public class CalendarService {

    /** The grid shows neighbour days, so keep one year of margin inside the engine's 1900–2100 range. */
    private static final int MIN_YEAR = LunarCalendar.MIN_YEAR + 1;
    private static final int MAX_YEAR = LunarCalendar.MAX_YEAR - 1;
    private static final int GRID_DAYS = 42;

    public Day fromSolar(LocalDate date) {
        checkYear(date.getYear());
        LunarDate lunar = LunarCalendar.toLunar(date);
        return new Day(date, date.getDayOfWeek().getValue(), lunar(lunar), CanChi.ofDay(date), holidays(date, lunar));
    }

    public Day fromLunar(int day, int month, int year, boolean leap) {
        checkYear(year);
        LunarDate lunar;
        try {
            lunar = new LunarDate(day, month, year, leap);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_LUNAR_DATE);
        }
        LocalDate solar = LunarCalendar.toSolar(lunar)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_LUNAR_DATE));
        return fromSolar(solar);
    }

    public Month month(int year, int month) {
        checkYear(year);
        if (month < 1 || month > 12) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        LocalDate first = LocalDate.of(year, month, 1);
        LocalDate gridStart = first.minusDays(first.getDayOfWeek().getValue() - (long) DayOfWeek.MONDAY.getValue());
        List<Cell> cells = new ArrayList<>(GRID_DAYS);
        for (int i = 0; i < GRID_DAYS; i++) {
            LocalDate d = gridStart.plusDays(i);
            LunarDate l = LunarCalendar.toLunar(d);
            cells.add(new Cell(d, d.getMonthValue() == month, l.day(), l.month(), l.leap(), holidays(d, l)));
        }
        return new Month(year, month, subtitle(first, first.withDayOfMonth(first.lengthOfMonth())), cells);
    }

    /** "Tháng Chín – tháng Mười năm Bính Ngọ", as printed on Vietnamese wall calendars. */
    private static String subtitle(LocalDate from, LocalDate to) {
        LunarDate a = LunarCalendar.toLunar(from);
        LunarDate b = LunarCalendar.toLunar(to);
        String first = capitalise(name(a));
        String range = a.month() == b.month() && a.leap() == b.leap() ? first : first + " – " + name(b);
        return range + " năm " + CanChi.ofYear(b.year());
    }

    private static String name(LunarDate l) {
        return CanChi.monthName(l.month()) + (l.leap() ? " nhuận" : "");
    }

    private static Lunar lunar(LunarDate l) {
        return new Lunar(l.day(), l.month(), l.year(), l.leap(), name(l), CanChi.ofMonth(l.month(), l.year()),
                CanChi.ofYear(l.year()));
    }

    private static List<HolidayView> holidays(LocalDate date, LunarDate lunar) {
        return Holidays.on(date, lunar).stream()
                .map(h -> new HolidayView(h.name(), h.lunar(), h.publicHoliday()))
                .toList();
    }

    private static String capitalise(String s) {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static void checkYear(int year) {
        if (year < MIN_YEAR || year > MAX_YEAR) {
            throw new BusinessException(ErrorCode.DATE_OUT_OF_RANGE);
        }
    }
}

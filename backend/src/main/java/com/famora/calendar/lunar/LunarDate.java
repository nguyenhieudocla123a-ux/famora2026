package com.famora.calendar.lunar;

/**
 * A day of the Vietnamese lunar calendar.
 *
 * @param day   1 to 30
 * @param month 1 to 12
 * @param year  the lunar year, named after the solar year in which its Tết falls
 * @param leap  true for the repeated (nhuận) month
 */
public record LunarDate(int day, int month, int year, boolean leap) {

    public LunarDate {
        if (day < 1 || day > 30 || month < 1 || month > 12) {
            throw new IllegalArgumentException("Ngày âm lịch không hợp lệ: " + day + "/" + month);
        }
    }

    @Override
    public String toString() {
        return day + "/" + month + (leap ? " nhuận" : "") + "/" + year;
    }
}

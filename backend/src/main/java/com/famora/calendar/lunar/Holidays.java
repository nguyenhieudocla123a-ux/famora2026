package com.famora.calendar.lunar;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Vietnamese holidays and observances shown on the family calendar. Lunar ones fall on the ordinary month
 * only, never on its leap repeat (a leap 8th month has no second Trung Thu).
 */
public final class Holidays {

    /** {@code publicHoliday}: a day off by law (Bộ luật Lao động 2019, Điều 112). */
    public record Holiday(String name, boolean lunar, boolean publicHoliday) {
    }

    private static final Map<MonthDay, Holiday> SOLAR = Map.ofEntries(
            Map.entry(MonthDay.of(1, 1), new Holiday("Tết Dương lịch", false, true)),
            Map.entry(MonthDay.of(3, 8), new Holiday("Quốc tế Phụ nữ", false, false)),
            Map.entry(MonthDay.of(4, 30), new Holiday("Ngày Giải phóng miền Nam", false, true)),
            Map.entry(MonthDay.of(5, 1), new Holiday("Quốc tế Lao động", false, true)),
            Map.entry(MonthDay.of(6, 1), new Holiday("Quốc tế Thiếu nhi", false, false)),
            Map.entry(MonthDay.of(6, 28), new Holiday("Ngày Gia đình Việt Nam", false, false)),
            Map.entry(MonthDay.of(9, 2), new Holiday("Quốc khánh", false, true)),
            Map.entry(MonthDay.of(10, 20), new Holiday("Ngày Phụ nữ Việt Nam", false, false)),
            Map.entry(MonthDay.of(11, 20), new Holiday("Ngày Nhà giáo Việt Nam", false, false)));

    /** Keyed by lunar month * 100 + day. */
    private static final Map<Integer, Holiday> LUNAR = Map.ofEntries(
            Map.entry(101, new Holiday("Tết Nguyên Đán", true, true)),
            Map.entry(102, new Holiday("Mùng 2 Tết", true, true)),
            Map.entry(103, new Holiday("Mùng 3 Tết", true, true)),
            Map.entry(115, new Holiday("Rằm tháng Giêng", true, false)),
            Map.entry(310, new Holiday("Giỗ Tổ Hùng Vương", true, true)),
            Map.entry(415, new Holiday("Lễ Phật Đản", true, false)),
            Map.entry(505, new Holiday("Tết Đoan Ngọ", true, false)),
            Map.entry(715, new Holiday("Lễ Vu Lan", true, false)),
            Map.entry(815, new Holiday("Tết Trung Thu", true, false)),
            Map.entry(1223, new Holiday("Ông Công Ông Táo", true, false)));

    private static final Holiday GIAO_THUA = new Holiday("Giao thừa", true, true);

    private Holidays() {
    }

    public static List<Holiday> on(LocalDate solar, LunarDate lunar) {
        List<Holiday> found = new ArrayList<>(2);
        Holiday s = SOLAR.get(MonthDay.from(solar));
        if (s != null) {
            found.add(s);
        }
        if (!lunar.leap()) {
            Holiday l = LUNAR.get(lunar.month() * 100 + lunar.day());
            if (l != null) {
                found.add(l);
            }
            // New Year's Eve is the last day of month 12, which is the 29th in a short year
            if (lunar.month() == 12 && LunarCalendar.toLunar(solar.plusDays(1)).month() == 1) {
                found.add(GIAO_THUA);
            }
        }
        return found;
    }

    public static List<Holiday> on(LocalDate solar) {
        return on(solar, LunarCalendar.toLunar(solar));
    }
}

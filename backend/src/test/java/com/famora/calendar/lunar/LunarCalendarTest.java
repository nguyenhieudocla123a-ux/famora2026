package com.famora.calendar.lunar;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Pure unit tests (no Spring, no database): the lunar engine checked against published dates. */
class LunarCalendarTest {

    @Nested
    @DisplayName("Tết Nguyên Đán (1/1 âm) đúng theo lịch Việt Nam")
    class Tet {

        /** Tết dates as published for Vietnam. */
        @ParameterizedTest(name = "Tết {0} là {1}")
        @CsvSource({
            "1990, 1990-01-27", "1995, 1995-01-31", "1999, 1999-02-16",
            "2000, 2000-02-05", "2001, 2001-01-24", "2002, 2002-02-12", "2003, 2003-02-01", "2004, 2004-01-22",
            "2005, 2005-02-09", "2006, 2006-01-29", "2008, 2008-02-07", "2009, 2009-01-26", "2010, 2010-02-14",
            "2011, 2011-02-03", "2012, 2012-01-23", "2013, 2013-02-10", "2014, 2014-01-31", "2015, 2015-02-19",
            "2016, 2016-02-08", "2017, 2017-01-28", "2018, 2018-02-16", "2019, 2019-02-05", "2020, 2020-01-25",
            "2021, 2021-02-12", "2022, 2022-02-01", "2023, 2023-01-22", "2024, 2024-02-10", "2025, 2025-01-29",
            "2026, 2026-02-17", "2027, 2027-02-06"
        })
        void tet(int year, LocalDate expected) {
            assertThat(LunarCalendar.toSolar(new LunarDate(1, 1, year, false))).contains(expected);
            assertThat(LunarCalendar.toLunar(expected)).isEqualTo(new LunarDate(1, 1, year, false));
        }

        /** Years where Vietnam (UTC+7) and China (UTC+8) celebrate Tết on different days. */
        @ParameterizedTest(name = "Tết {0}: Việt Nam {1}, không phải {2} như Trung Quốc")
        @CsvSource({
            "1968, 1968-01-29, 1968-01-30",
            "1985, 1985-01-21, 1985-02-20",
            "2007, 2007-02-17, 2007-02-18"
        })
        void differsFromChina(int year, LocalDate vietnam, LocalDate china) {
            LocalDate tet = LunarCalendar.toSolar(new LunarDate(1, 1, year, false)).orElseThrow();
            assertThat(tet).isEqualTo(vietnam).isNotEqualTo(china);
        }
    }

    @Nested
    @DisplayName("Tháng nhuận")
    class LeapMonths {

        @ParameterizedTest(name = "Năm {0} nhuận tháng {1}")
        @CsvSource({"2001, 4", "2004, 2", "2006, 7", "2009, 5", "2012, 4", "2014, 9", "2017, 6", "2020, 4",
            "2023, 2", "2025, 6", "2028, 5"})
        void leapYears(int year, int month) {
            assertThat(LunarCalendar.leapMonthOf(year)).contains(month);
        }

        @ParameterizedTest(name = "Năm {0} không có tháng nhuận")
        @CsvSource({"2019", "2021", "2022", "2024", "2026", "2027"})
        void ordinaryYears(int year) {
            assertThat(LunarCalendar.leapMonthOf(year)).isEmpty();
        }

        @Test
        @DisplayName("Tháng 2 nhuận năm Quý Mão 2023 bắt đầu 22/03/2023")
        void leapMonthStart() {
            assertThat(LunarCalendar.toSolar(new LunarDate(1, 2, 2023, true))).contains(LocalDate.of(2023, 3, 22));
            assertThat(LunarCalendar.toLunar(LocalDate.of(2023, 3, 22))).isEqualTo(new LunarDate(1, 2, 2023, true));
        }

        @Test
        @DisplayName("Tháng nhuận không có trong năm đó thì không tồn tại")
        void missingLeapMonth() {
            assertThat(LunarCalendar.toSolar(new LunarDate(1, 3, 2023, true))).isEmpty();
            assertThat(LunarCalendar.toSolar(new LunarDate(1, 2, 2024, true))).isEmpty();
        }
    }

    @Nested
    @DisplayName("Các ngày cụ thể")
    class KnownDays {

        @ParameterizedTest(name = "{0} = {1}/{2}/{3} âm")
        @CsvSource({
            "2025-04-07, 10, 3, 2025",  // Giỗ Tổ Hùng Vương 2025
            "2024-09-17, 15, 8, 2024",  // Trung Thu 2024
            "2025-10-06, 15, 8, 2025",  // Trung Thu 2025
            "2026-11-09,  1, 10, 2026", // matches the mobile mock table
            "2026-11-27, 19, 10, 2026",
            "2027-02-05, 29, 12, 2026", // Giao thừa before Tết Đinh Mùi
            "2054-05-07, 30, 3, 2054",  // came out as "day 0" before the k-estimate fix
            "2062-04-09, 30, 2, 2062"   // same
        })
        void day(LocalDate solar, int d, int m, int y) {
            assertThat(LunarCalendar.toLunar(solar)).isEqualTo(new LunarDate(d, m, y, false));
        }

        @Test
        @DisplayName("Ngày 30 của tháng thiếu (29 ngày) không tồn tại")
        void thirtiethOfShortMonth() {
            // lunar month 12 of 2026 has 29 days: Tết 2027 follows its 29th
            assertThat(LunarCalendar.monthLength(12, 2026, false)).contains(29);
            assertThat(LunarCalendar.toSolar(new LunarDate(30, 12, 2026, false))).isEmpty();
        }
    }

    @Nested
    @DisplayName("Can chi và ngày lễ")
    class Names {

        @Test
        void canChi() {
            assertThat(CanChi.ofDay(LocalDate.of(2000, 1, 1))).isEqualTo("Mậu Ngọ");
            assertThat(CanChi.ofYear(2026)).isEqualTo("Bính Ngọ");
            assertThat(CanChi.ofYear(2027)).isEqualTo("Đinh Mùi");
            assertThat(CanChi.ofYear(1968)).isEqualTo("Mậu Thân");
            assertThat(CanChi.ofMonth(10, 2026)).isEqualTo("Kỷ Hợi");
            assertThat(CanChi.monthName(1)).isEqualTo("tháng Giêng");
            assertThat(CanChi.monthName(12)).isEqualTo("tháng Chạp");
        }

        @Test
        void holidays() {
            assertThat(Holidays.on(LocalDate.of(2027, 2, 6))).extracting(Holidays.Holiday::name)
                    .containsExactly("Tết Nguyên Đán");
            assertThat(Holidays.on(LocalDate.of(2027, 2, 5))).extracting(Holidays.Holiday::name)
                    .containsExactly("Giao thừa");
            assertThat(Holidays.on(LocalDate.of(2026, 9, 2))).extracting(Holidays.Holiday::name)
                    .containsExactly("Quốc khánh");
            assertThat(Holidays.on(LocalDate.of(2026, 11, 27))).isEmpty();
        }

        @Test
        @DisplayName("Tháng 2 nhuận không có ngày lễ lặp lại")
        void noHolidayOnLeapRepeat() {
            // 15/6 nhuận 2025 is not a second Vu Lan or anything else
            LocalDate leapFifteenth = LunarCalendar.toSolar(new LunarDate(15, 6, 2025, true)).orElseThrow();
            assertThat(Holidays.on(leapFifteenth)).isEmpty();
        }
    }

    @Nested
    @DisplayName("Kiểm tra trên mọi ngày 1900–2100")
    class Properties {

        @Test
        @DisplayName("Dương → âm → dương trả lại đúng ngày, và ngày âm tăng liên tục")
        void roundTripEveryDay() {
            LocalDate start = LocalDate.of(1900, 2, 1);
            LocalDate end = LocalDate.of(2100, 12, 31);
            LunarDate previous = LunarCalendar.toLunar(start.minusDays(1));
            int checked = 0;
            for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
                LunarDate lunar = LunarCalendar.toLunar(d);
                assertThat(LunarCalendar.toSolar(lunar)).as("round trip of %s (%s)", d, lunar).contains(d);
                if (lunar.day() == 1) {
                    assertThat(previous.day()).as("month before %s ends on 29 or 30", d).isIn(29, 30);
                } else {
                    assertThat(lunar.day()).as("day after %s", previous).isEqualTo(previous.day() + 1);
                    assertThat(lunar.month()).isEqualTo(previous.month());
                    assertThat(lunar.leap()).isEqualTo(previous.leap());
                }
                previous = lunar;
                checked++;
            }
            assertThat(checked).isGreaterThan(73_000);
        }

        @Test
        @DisplayName("Mỗi năm âm có 12 tháng, hoặc 13 nếu có tháng nhuận; mỗi tháng 29 hoặc 30 ngày")
        void monthsPerYear() {
            for (int year = 1901; year <= 2099; year++) {
                Optional<Integer> leap = LunarCalendar.leapMonthOf(year);
                for (int month = 1; month <= 12; month++) {
                    assertThat(LunarCalendar.monthLength(month, year, false)).as("%d/%d", month, year).isPresent()
                            .get().isIn(29, 30);
                }
                int y = year;
                leap.ifPresent(m -> assertThat(LunarCalendar.monthLength(m, y, true)).isPresent());
            }
        }
    }
}

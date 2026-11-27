package com.famora.calendar.occurrence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.Recurrence;
import com.famora.calendar.occurrence.OccurrenceCalculator.Occurrence;
import com.famora.calendar.occurrence.OccurrenceCalculator.Rule;

class OccurrenceCalculatorTest {

    private static Rule solar(LocalDate date, Recurrence r) {
        return new Rule(CalendarType.SOLAR, r, date, null, null, null, false);
    }

    private static Rule lunarYearly(int day, int month, Integer year, boolean leap) {
        return new Rule(CalendarType.LUNAR, Recurrence.YEARLY, null, day, month, year, leap);
    }

    private static List<LocalDate> dates(List<Occurrence> os) {
        return os.stream().map(Occurrence::date).toList();
    }

    @Test
    @DisplayName("Sự kiện một lần: chỉ xuất hiện nếu nằm trong khoảng")
    void once() {
        Rule r = solar(LocalDate.of(2026, 11, 28), Recurrence.NONE);
        assertThat(dates(OccurrenceCalculator.expand(r, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30))))
                .containsExactly(LocalDate.of(2026, 11, 28));
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 31))).isEmpty();
    }

    @Test
    @DisplayName("Sinh nhật dương hằng năm, kèm số năm: không xuất hiện trước năm gốc")
    void yearlySolar() {
        Rule r = solar(LocalDate.of(1998, 5, 14), Recurrence.YEARLY);
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(2026, 1, 1), LocalDate.of(2027, 12, 31)))
                .containsExactly(new Occurrence(LocalDate.of(2026, 5, 14), 28), new Occurrence(LocalDate.of(2027, 5, 14), 29));
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(1990, 1, 1), LocalDate.of(1997, 12, 31))).isEmpty();
    }

    @Test
    @DisplayName("Sinh ngày 29/02: năm không nhuận dùng 28/02")
    void feb29() {
        Rule r = solar(LocalDate.of(2000, 2, 29), Recurrence.YEARLY);
        assertThat(dates(OccurrenceCalculator.expand(r, LocalDate.of(2026, 1, 1), LocalDate.of(2028, 12, 31))))
                .containsExactly(LocalDate.of(2026, 2, 28), LocalDate.of(2027, 2, 28), LocalDate.of(2028, 2, 29));
    }

    @Test
    @DisplayName("Giỗ 21/10 âm hằng năm: 29/11/2026 và 18/11/2027")
    void yearlyLunar() {
        Rule r = lunarYearly(21, 10, null, false);
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(2026, 1, 1), LocalDate.of(2027, 12, 31)))
                .containsExactly(new Occurrence(LocalDate.of(2026, 11, 29), null),
                        new Occurrence(LocalDate.of(2027, 11, 18), null));
    }

    @Test
    @DisplayName("Giỗ ngày 30 tháng Chạp: năm 2026 tháng Chạp chỉ 29 ngày nên giỗ ngày 29 (05/02/2027)")
    void thirtiethOfShortMonth() {
        Rule r = lunarYearly(30, 12, null, false);
        assertThat(dates(OccurrenceCalculator.expand(r, LocalDate.of(2027, 1, 1), LocalDate.of(2027, 2, 28))))
                .containsExactly(LocalDate.of(2027, 2, 5));
    }

    @Test
    @DisplayName("Mất trong tháng 2 nhuận 2023: các năm sau giỗ vào tháng 2 thường")
    void leapOrigin() {
        Rule r = lunarYearly(10, 2, 2023, true);
        // 10/2 âm 2024 = 19/03/2024; 10/2 âm 2025 = 09/03/2025
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(2024, 1, 1), LocalDate.of(2025, 12, 31)))
                .containsExactly(new Occurrence(LocalDate.of(2024, 3, 19), 1), new Occurrence(LocalDate.of(2025, 3, 9), 2));
    }

    @Test
    @DisplayName("Tháng 11–12 âm rơi sang năm dương sau: khoảng tháng 1/2027 vẫn thấy giỗ 15/12 âm năm 2026")
    void lateLunarMonthsCrossTheSolarYear() {
        Rule r = lunarYearly(15, 12, null, false);
        assertThat(dates(OccurrenceCalculator.expand(r, LocalDate.of(2027, 1, 1), LocalDate.of(2027, 1, 31))))
                .containsExactly(LocalDate.of(2027, 1, 22));
    }

    @Test
    @DisplayName("Năm gốc biết trước: không có lần nào trước năm gốc")
    void lunarNotBeforeOrigin() {
        Rule r = lunarYearly(21, 10, 2026, false);
        assertThat(OccurrenceCalculator.expand(r, LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31)))
                .containsExactly(new Occurrence(LocalDate.of(2026, 11, 29), 0));
    }
}

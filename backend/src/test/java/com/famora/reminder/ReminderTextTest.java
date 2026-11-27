package com.famora.reminder;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;

import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.event.EventSnapshot;

class ReminderTextTest {

    private static EventSnapshot giỗ(LocalTime time) {
        return new EventSnapshot(1, 1, 1, EventType.DEATH_ANNIVERSARY, "Giỗ bà nội", time, null);
    }

    @Test
    void readsLikeAFamilyWouldSayIt() {
        LocalDate day = LocalDate.of(2026, 11, 29);
        assertThat(ReminderDispatcher.body(7, day, giỗ(LocalTime.of(10, 0))))
                .isEqualTo("Còn 7 ngày: Chủ nhật 29/11/2026 (21/10 âm) lúc 10:00");
        assertThat(ReminderDispatcher.body(1, day, giỗ(null))).isEqualTo("Ngày mai: Chủ nhật 29/11/2026 (21/10 âm)");
        assertThat(ReminderDispatcher.body(0, day, giỗ(null))).startsWith("Hôm nay: ");
    }
}

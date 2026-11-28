package com.famora.reminder;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.calendar.event.EventService;
import com.famora.calendar.event.EventSnapshot;
import com.famora.calendar.lunar.LunarCalendar;
import com.famora.calendar.lunar.LunarDate;
import com.famora.common.config.ClockConfig;
import com.famora.family.FamilyAccessService;
import com.famora.notification.NotificationService;

/**
 * Sends what is due: turns each due reminder into a notification and marks it SENT, in one transaction, so a
 * crash in between leaves the reminder PENDING and it is sent on the next run instead of being lost.
 */
@Service
public class ReminderDispatcher {

    private static final int BATCH = 200;
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final ReminderScheduleRepository schedules;
    private final EventService events;
    private final FamilyAccessService access;
    private final NotificationService notifications;
    private final Clock clock;

    public ReminderDispatcher(ReminderScheduleRepository schedules, EventService events, FamilyAccessService access,
            NotificationService notifications, Clock clock) {
        this.schedules = schedules;
        this.events = events;
        this.access = access;
        this.notifications = notifications;
        this.clock = clock;
    }

    /** Returns how many notifications were sent. */
    @Transactional
    public int dispatchDue() {
        Instant now = Instant.now(clock);
        LocalDate today = LocalDate.ofInstant(now, ClockConfig.VIETNAM);
        int sent = 0;
        List<ReminderSchedule> due = schedules.lockDue(now, BATCH);
        for (ReminderSchedule r : due) {
            // late on the same day is fine; a day late its words ("Ngày mai") would be wrong: dropped
            if (LocalDate.ofInstant(r.getFireAt(), ClockConfig.VIETNAM).isBefore(today)) {
                r.cancel();
                continue;
            }
            Optional<EventSnapshot> event = events.snapshot(r.getEventId());
            // the event may be gone, or the person may have left the family since planning: check again
            if (event.isEmpty() || !access.isActiveUser(event.get().familyId(), r.getUserId())) {
                r.cancel();
                continue;
            }
            EventSnapshot e = event.get();
            notifications.create(r.getUserId(), e.familyId(), "REMINDER", e.title(),
                    body(r.getOffsetDays(), r.getOccurrenceDate(), e), "EVENT", e.id(),
                    r.getOccurrenceDate());
            r.markSent(now);
            sent++;
        }
        return sent;
    }

    /** "Còn 7 ngày: Chủ nhật 29/11/2026 (21/10 âm) lúc 10:00". */
    static String body(int offsetDays, LocalDate date, EventSnapshot e) {
        String when = switch (offsetDays) {
            case 0 -> "Hôm nay";
            case 1 -> "Ngày mai";
            default -> "Còn " + offsetDays + " ngày";
        };
        LunarDate l = LunarCalendar.toLunar(date);
        String lunar = l.day() + "/" + l.month() + (l.leap() ? " nhuận" : "") + " âm";
        String time = e.startTime() == null ? "" : " lúc " + e.startTime().format(TIME);
        return when + ": " + weekday(date.getDayOfWeek()) + " " + date.format(DATE) + " (" + lunar + ")" + time;
    }

    private static String weekday(DayOfWeek d) {
        return switch (d) {
            case MONDAY -> "Thứ Hai";
            case TUESDAY -> "Thứ Ba";
            case WEDNESDAY -> "Thứ Tư";
            case THURSDAY -> "Thứ Năm";
            case FRIDAY -> "Thứ Sáu";
            case SATURDAY -> "Thứ Bảy";
            case SUNDAY -> "Chủ nhật";
        };
    }
}

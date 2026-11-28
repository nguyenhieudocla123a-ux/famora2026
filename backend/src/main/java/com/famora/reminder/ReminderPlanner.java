package com.famora.reminder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import com.famora.calendar.event.EventChanged;
import com.famora.calendar.event.EventService;
import com.famora.calendar.event.EventSnapshot;
import com.famora.calendar.occurrence.OccurrenceCalculator;
import com.famora.common.config.ClockConfig;
import com.famora.family.FamilyAccessService;
import com.famora.notification.NotificationService;

/**
 * Plans reminders ahead: for each event and each family member, which reminders fire in the next
 * {@value #HORIZON_DAYS} days, written to reminder_schedules. Runs every night and again whenever an event
 * or a reminder setting changes. Running it again is always safe (see ReminderScheduleRepository.upsert).
 */
@Service
public class ReminderPlanner {

    private static final Logger log = LoggerFactory.getLogger(ReminderPlanner.class);

    /** How far ahead reminders are queued; the nightly run keeps the window moving. */
    public static final int HORIZON_DAYS = 30;
    private static final int MAX_OFFSET_DAYS = 30;
    private static final int KEEP_HISTORY_DAYS = 90;

    private final EventService events;
    private final FamilyAccessService access;
    private final ReminderSettingRepository settings;
    private final ReminderScheduleRepository schedules;
    private final NotificationService notifications;
    private final Clock clock;

    public ReminderPlanner(EventService events, FamilyAccessService access, ReminderSettingRepository settings,
            ReminderScheduleRepository schedules, NotificationService notifications, Clock clock) {
        this.events = events;
        this.access = access;
        this.settings = settings;
        this.schedules = schedules;
        this.notifications = notifications;
        this.clock = clock;
    }

    /** Re-plans one event after its change is committed (a failure here never undoes the user's edit). */
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventChanged(EventChanged changed) {
        replan(changed.eventId());
    }

    @Transactional
    public void replan(long eventId) {
        schedules.cancelPending(eventId);
        events.snapshot(eventId).ifPresent(e -> plan(e, Instant.now(clock)));
    }

    /** The nightly run: every live event of every live family, then housekeeping. Returns reminders queued. */
    @Transactional
    public int planAll() {
        Instant now = Instant.now(clock);
        int queued = 0;
        for (EventSnapshot e : events.liveSnapshots()) {
            schedules.cancelPending(e.id());
            queued += plan(e, now);
        }
        Instant before = now.minus(KEEP_HISTORY_DAYS, ChronoUnit.DAYS);
        int oldReminders = schedules.deleteFinishedBefore(before);
        int oldNotifications = notifications.deleteOlderThan(before);
        log.info("Reminder planner: {} reminders queued; removed {} old reminders and {} old notifications",
                queued, oldReminders, oldNotifications);
        return queued;
    }

    private int plan(EventSnapshot e, Instant now) {
        LocalDate today = LocalDate.ofInstant(now, ClockConfig.VIETNAM);
        LocalDate lastFireDay = today.plusDays(HORIZON_DAYS);
        // an occurrence up to 30 days after the window can still have a reminder inside it
        List<OccurrenceCalculator.Occurrence> occurrences =
                OccurrenceCalculator.expand(e.rule(), today, lastFireDay.plusDays(MAX_OFFSET_DAYS));
        if (occurrences.isEmpty()) {
            return 0;
        }
        Map<Long, ReminderSetting> personal = new HashMap<>();
        ReminderSetting family = null;
        for (ReminderSetting s : settings.findByEventId(e.id())) {
            if (s.getUserId() == null) {
                family = s;
            } else {
                personal.put(s.getUserId(), s);
            }
        }
        int queued = 0;
        for (long userId : access.activeUserIds(e.familyId())) {
            Effective rule = Effective.of(personal.getOrDefault(userId, family));
            for (OccurrenceCalculator.Occurrence o : occurrences) {
                for (int offset : rule.offsets()) {
                    LocalDate fireDay = o.date().minusDays(offset);
                    Instant fireAt = LocalDateTime.of(fireDay, rule.time()).atZone(ClockConfig.VIETNAM).toInstant();
                    // outside the window, or a day already gone: skipped. A time already past TODAY is still
                    // queued: the dispatcher sends it late on its next run (the server was off at 08:00, or this
                    // run came just before the dispatcher's). Its text ("Ngày mai: ...") is right all day.
                    if (fireDay.isAfter(lastFireDay) || fireDay.isBefore(today)) {
                        continue;
                    }
                    queued += schedules.upsert(e.id(), userId, o.date(), offset, fireAt);
                }
            }
        }
        return queued;
    }

    /** The setting that applies: personal, else the event's family-wide one, else the app default. */
    record Effective(Integer[] offsets, LocalTime time) {

        static final Effective DEFAULT = new Effective(new Integer[] {7, 1}, LocalTime.of(8, 0));

        static Effective of(ReminderSetting s) {
            return s == null ? DEFAULT : new Effective(s.getOffsetDays(), s.getRemindTime());
        }
    }
}

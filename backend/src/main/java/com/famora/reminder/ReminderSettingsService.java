package com.famora.reminder;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.TreeSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.calendar.event.EventService;
import com.famora.calendar.event.EventSnapshot;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.FamilyAccessService;

/**
 * Reading and changing an event's reminder settings. Everyone in the family sets their own; the family-wide
 * setting is changed by whoever may edit the event. Each change re-plans the event's reminders at once.
 */
@Service
public class ReminderSettingsService {

    private final ReminderSettingRepository settings;
    private final ReminderPlanner planner;
    private final EventService events;
    private final FamilyAccessService access;

    public ReminderSettingsService(ReminderSettingRepository settings, ReminderPlanner planner, EventService events,
            FamilyAccessService access) {
        this.settings = settings;
        this.planner = planner;
        this.events = events;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public SettingsView get(long familyId, long userId, long eventId) {
        access.requireMember(familyId, userId);
        event(familyId, eventId);
        SettingView family = settings.findByEventIdAndUserIdIsNull(eventId).map(SettingView::of).orElse(null);
        SettingView mine = settings.findByEventIdAndUserId(eventId, userId).map(SettingView::of).orElse(null);
        SettingView effective = mine != null ? mine : family != null ? family : SettingView.DEFAULT;
        return new SettingsView(family, mine, effective);
    }

    @Transactional
    public SettingsView setMine(long familyId, long userId, long eventId, List<Integer> offsets, LocalTime time) {
        access.requireMember(familyId, userId);
        event(familyId, eventId);
        save(settings.findByEventIdAndUserId(eventId, userId).orElseGet(() -> new ReminderSetting(eventId, userId)),
                offsets, time);
        planner.replan(eventId);
        return get(familyId, userId, eventId);
    }

    /** Back to the family-wide setting (or the default). */
    @Transactional
    public SettingsView clearMine(long familyId, long userId, long eventId) {
        access.requireMember(familyId, userId);
        event(familyId, eventId);
        settings.findByEventIdAndUserId(eventId, userId).ifPresent(settings::delete);
        settings.flush();
        planner.replan(eventId);
        return get(familyId, userId, eventId);
    }

    @Transactional
    public SettingsView setFamily(long familyId, long userId, long eventId, List<Integer> offsets, LocalTime time) {
        access.requireMember(familyId, userId);
        EventSnapshot e = event(familyId, eventId);
        access.requireCanEditEvent(familyId, userId, e.createdBy());
        save(settings.findByEventIdAndUserIdIsNull(eventId).orElseGet(() -> new ReminderSetting(eventId, null)),
                offsets, time);
        planner.replan(eventId);
        return get(familyId, userId, eventId);
    }

    private void save(ReminderSetting s, List<Integer> offsets, LocalTime time) {
        // sorted, no duplicates: [1, 7, 7] is stored as [7, 1]
        Integer[] clean = new TreeSet<>(offsets).descendingSet().toArray(Integer[]::new);
        s.set(clean, time == null ? SettingView.DEFAULT.time() : time);
        settings.saveAndFlush(s);
    }

    private EventSnapshot event(long familyId, long eventId) {
        return events.snapshot(eventId).filter(e -> e.familyId() == familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
    }

    /** {@code offsets} empty = reminders off. */
    public record SettingView(List<Integer> offsets, LocalTime time) {

        static final SettingView DEFAULT = new SettingView(List.of(7, 1), LocalTime.of(8, 0));

        static SettingView of(ReminderSetting s) {
            return new SettingView(Arrays.asList(s.getOffsetDays()), s.getRemindTime());
        }
    }

    /** What the family set, what I set, and what actually applies to me. */
    public record SettingsView(SettingView family, SettingView mine, SettingView effective) {
    }
}

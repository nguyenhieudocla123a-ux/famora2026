package com.famora.calendar.event;

import java.time.LocalTime;

import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.occurrence.OccurrenceCalculator;

/** A read-only copy of an event for other modules: they never touch the entity or its repository. */
public record EventSnapshot(long id, long familyId, long createdBy, EventType type, String title, LocalTime startTime,
        OccurrenceCalculator.Rule rule) {

    static EventSnapshot of(FamilyEvent e) {
        return new EventSnapshot(e.getId(), e.getFamilyId(), e.getCreatedBy(), e.getType(), e.getTitle(),
                e.getStartTime(), e.rule());
    }
}

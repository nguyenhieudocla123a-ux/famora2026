package com.famora.calendar.event;

/** The small vocabularies of an event. */
public final class EventEnums {

    private EventEnums() {
    }

    public enum EventType {
        BIRTHDAY,
        DEATH_ANNIVERSARY,
        WEDDING_ANNIVERSARY,
        FAMILY_EVENT,
        IMPORTANT_DAY,
        HOLIDAY
    }

    /** Which calendar the date was given in. */
    public enum CalendarType {
        SOLAR,
        LUNAR
    }

    public enum Recurrence {
        NONE,
        YEARLY
    }
}

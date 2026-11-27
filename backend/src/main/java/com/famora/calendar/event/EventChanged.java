package com.famora.calendar.event;

/** Published after an event is created, edited or deleted; the reminder planner re-plans it after commit. */
public record EventChanged(long eventId) {
}

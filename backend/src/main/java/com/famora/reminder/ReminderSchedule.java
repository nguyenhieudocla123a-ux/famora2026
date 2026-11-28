package com.famora.reminder;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One planned reminder: send it to {@code userId} at {@code fireAt}. Written by the planner's SQL upsert. */
@Entity
@Table(name = "reminder_schedules")
public class ReminderSchedule {

    @Id
    private Long id;

    @Column(name = "event_id", nullable = false, updatable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "occurrence_date", nullable = false, updatable = false)
    private LocalDate occurrenceDate;

    @Column(name = "offset_days", nullable = false, updatable = false)
    private short offsetDays;

    @Column(name = "fire_at", nullable = false, updatable = false)
    private Instant fireAt;

    @Column(nullable = false, length = 12)
    private String status;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ReminderSchedule() {
    }

    void markSent(Instant now) {
        status = "SENT";
        sentAt = now;
    }

    void cancel() {
        status = "CANCELLED";
    }

    Long getEventId() {
        return eventId;
    }

    Long getUserId() {
        return userId;
    }

    Instant getFireAt() {
        return fireAt;
    }

    LocalDate getOccurrenceDate() {
        return occurrenceDate;
    }

    int getOffsetDays() {
        return offsetDays;
    }
}

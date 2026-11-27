package com.famora.reminder;

import java.time.Instant;
import java.time.LocalTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/** How an event reminds: for the whole family (userId null) or for one person. */
@Entity
@Table(name = "event_reminders")
public class ReminderSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, updatable = false)
    private Long eventId;

    @Column(name = "user_id", updatable = false)
    private Long userId;

    /** Days before the occurrence; empty means "don't remind". */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "offset_days", nullable = false, columnDefinition = "integer[]")
    private Integer[] offsetDays;

    @Column(name = "remind_time", nullable = false)
    private LocalTime remindTime;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ReminderSetting() {
    }

    ReminderSetting(Long eventId, Long userId) {
        this.eventId = eventId;
        this.userId = userId;
    }

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    void set(Integer[] offsetDays, LocalTime remindTime) {
        this.offsetDays = offsetDays;
        this.remindTime = remindTime;
    }

    Long getUserId() {
        return userId;
    }

    Integer[] getOffsetDays() {
        return offsetDays.clone();
    }

    LocalTime getRemindTime() {
        return remindTime;
    }
}

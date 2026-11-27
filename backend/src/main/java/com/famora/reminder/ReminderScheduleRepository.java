package com.famora.reminder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ReminderScheduleRepository extends JpaRepository<ReminderSchedule, Long> {

    /**
     * Queues one reminder, idempotently. A row that already exists keeps its key: a PENDING or CANCELLED one
     * becomes PENDING with the new time; a SENT one is left alone, so nobody is reminded twice.
     */
    @Modifying
    @Query(value = """
            insert into reminder_schedules (event_id, user_id, occurrence_date, offset_days, fire_at, status)
            values (:eventId, :userId, :occurrenceDate, :offsetDays, :fireAt, 'PENDING')
            on conflict (event_id, user_id, occurrence_date, offset_days)
            do update set fire_at = excluded.fire_at, status = 'PENDING'
            where reminder_schedules.status <> 'SENT'
            """, nativeQuery = true)
    int upsert(@Param("eventId") long eventId, @Param("userId") long userId,
            @Param("occurrenceDate") LocalDate occurrenceDate, @Param("offsetDays") int offsetDays,
            @Param("fireAt") Instant fireAt);

    /** Before re-planning an event: everything still waiting is withdrawn; the plan puts back what still holds. */
    @Modifying
    @Query(value = "update reminder_schedules set status = 'CANCELLED' where event_id = :eventId and status = 'PENDING'",
            nativeQuery = true)
    int cancelPending(@Param("eventId") long eventId);

    /**
     * Due reminders, locked for this transaction. SKIP LOCKED lets a second server (Phase 9) take other rows
     * instead of waiting on these or sending them a second time.
     */
    @Query(value = """
            select * from reminder_schedules
            where status = 'PENDING' and fire_at <= :now
            order by fire_at
            limit :limit
            for update skip locked
            """, nativeQuery = true)
    List<ReminderSchedule> lockDue(@Param("now") Instant now, @Param("limit") int limit);

    @Query(value = "select count(*) from reminder_schedules where event_id = :eventId and status = 'PENDING'",
            nativeQuery = true)
    long countPending(@Param("eventId") long eventId);

    @Modifying
    @Query(value = "delete from reminder_schedules where status <> 'PENDING' and fire_at < :before", nativeQuery = true)
    int deleteFinishedBefore(@Param("before") Instant before);
}

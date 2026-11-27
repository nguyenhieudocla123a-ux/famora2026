package com.famora.calendar.event;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.event.EventEnums.Recurrence;
import com.famora.calendar.occurrence.OccurrenceCalculator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "family_events")
public class FamilyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EventType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "calendar_type", nullable = false, length = 8)
    private CalendarType calendarType;

    @Column(name = "solar_date")
    private LocalDate solarDate;

    @Column(name = "lunar_day")
    private Short lunarDay;

    @Column(name = "lunar_month")
    private Short lunarMonth;

    @Column(name = "lunar_year")
    private Integer lunarYear;

    @Column(name = "lunar_leap_month", nullable = false)
    private boolean lunarLeapMonth;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Recurrence recurrence;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /** Optimistic lock: an edit based on an older version is refused instead of silently overwriting. */
    @Version
    private int version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FamilyEvent() {
    }

    FamilyEvent(Long familyId, Long createdBy) {
        this.familyId = familyId;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /** Sets every editable field at once; the service has already validated the combination. */
    void apply(EventType type, String title, String description, String location, CalendarType calendarType,
            LocalDate solarDate, Integer lunarDay, Integer lunarMonth, Integer lunarYear, boolean lunarLeapMonth,
            LocalTime startTime, Recurrence recurrence) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.location = location;
        this.calendarType = calendarType;
        this.solarDate = solarDate;
        this.lunarDay = lunarDay == null ? null : lunarDay.shortValue();
        this.lunarMonth = lunarMonth == null ? null : lunarMonth.shortValue();
        this.lunarYear = lunarYear;
        this.lunarLeapMonth = lunarLeapMonth;
        this.startTime = startTime;
        this.recurrence = recurrence;
    }

    void delete(Instant now) {
        deletedAt = now;
    }

    public OccurrenceCalculator.Rule rule() {
        return new OccurrenceCalculator.Rule(calendarType, recurrence, solarDate, getLunarDay(), getLunarMonth(),
                lunarYear, lunarLeapMonth);
    }

    public Long getId() {
        return id;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public EventType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getLocation() {
        return location;
    }

    public CalendarType getCalendarType() {
        return calendarType;
    }

    public LocalDate getSolarDate() {
        return solarDate;
    }

    public Integer getLunarDay() {
        return lunarDay == null ? null : lunarDay.intValue();
    }

    public Integer getLunarMonth() {
        return lunarMonth == null ? null : lunarMonth.intValue();
    }

    public Integer getLunarYear() {
        return lunarYear;
    }

    public boolean isLunarLeapMonth() {
        return lunarLeapMonth;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public Recurrence getRecurrence() {
        return recurrence;
    }

    public int getVersion() {
        return version;
    }
}

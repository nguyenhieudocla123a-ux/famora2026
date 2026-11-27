package com.famora.calendar.event;

import java.time.LocalDate;
import java.time.LocalTime;

import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.event.EventEnums.Recurrence;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request and response bodies of the event endpoints. */
public final class EventDtos {

    private EventDtos() {
    }

    /**
     * Create and update share this body. SOLAR needs {@code solarDate}; LUNAR needs {@code lunarDay} and
     * {@code lunarMonth}, plus {@code lunarYear} unless it repeats yearly. {@code version} is required on update.
     */
    public record EventRequest(
            @NotNull(message = "Chọn loại sự kiện") EventType type,
            @NotBlank(message = "Nhập tên sự kiện") @Size(max = 150, message = "Tên tối đa 150 ký tự") String title,
            @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự") String description,
            @Size(max = 200, message = "Địa điểm tối đa 200 ký tự") String location,
            @NotNull(message = "Chọn lịch âm hay dương") CalendarType calendarType,
            LocalDate solarDate,
            @Min(value = 1, message = "Ngày âm từ 1 đến 30") @Max(value = 30, message = "Ngày âm từ 1 đến 30") Integer lunarDay,
            @Min(value = 1, message = "Tháng âm từ 1 đến 12") @Max(value = 12, message = "Tháng âm từ 1 đến 12") Integer lunarMonth,
            Integer lunarYear,
            Boolean lunarLeapMonth,
            LocalTime startTime,
            Recurrence recurrence,
            Integer version) {
    }

    public record EventResponse(Long id, Long familyId, Long createdBy, EventType type, String title,
            String description, String location, CalendarType calendarType, LocalDate solarDate, Integer lunarDay,
            Integer lunarMonth, Integer lunarYear, boolean lunarLeapMonth, LocalTime startTime, Recurrence recurrence,
            int version) {

        static EventResponse from(FamilyEvent e) {
            return new EventResponse(e.getId(), e.getFamilyId(), e.getCreatedBy(), e.getType(), e.getTitle(),
                    e.getDescription(), e.getLocation(), e.getCalendarType(), e.getSolarDate(), e.getLunarDay(),
                    e.getLunarMonth(), e.getLunarYear(), e.isLunarLeapMonth(), e.getStartTime(), e.getRecurrence(),
                    e.getVersion());
        }
    }

    /**
     * One day an event falls on, ready for the calendar and the "upcoming" list.
     *
     * @param anniversary years since the original date (birthday age, wedding years); null when unknown
     */
    public record OccurrenceResponse(Long eventId, LocalDate date, int lunarDay, int lunarMonth, boolean lunarLeap,
            EventType type, String title, String location, LocalTime startTime, CalendarType calendarType,
            Recurrence recurrence, Integer anniversary) {
    }
}

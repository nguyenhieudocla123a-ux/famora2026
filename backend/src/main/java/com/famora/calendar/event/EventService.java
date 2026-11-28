package com.famora.calendar.event;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.calendar.event.EventDtos.EventRequest;
import com.famora.calendar.event.EventDtos.EventResponse;
import com.famora.calendar.event.EventDtos.OccurrenceResponse;
import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.event.EventEnums.Recurrence;
import com.famora.calendar.lunar.LunarCalendar;
import com.famora.calendar.lunar.LunarDate;
import com.famora.calendar.occurrence.OccurrenceCalculator;
import com.famora.common.config.ClockConfig;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.FamilyAccessService;

/**
 * Family events. Permissions follow the matrix: every member reads; creating depends on the family setting
 * for MEMBERs; OWNER and ADMIN edit everything, a MEMBER only what they created.
 */
@Service
public class EventService {

    private static final int MAX_RANGE_DAYS = 400;
    private static final int MAX_UPCOMING_DAYS = 365;

    private final FamilyEventRepository events;
    private final FamilyAccessService access;
    private final PersonLookup persons;
    private final ApplicationEventPublisher publisher;
    private final Clock clock;

    public EventService(FamilyEventRepository events, FamilyAccessService access, PersonLookup persons,
            ApplicationEventPublisher publisher, Clock clock) {
        this.events = events;
        this.access = access;
        this.persons = persons;
        this.publisher = publisher;
        this.clock = clock;
    }

    @Transactional
    public EventResponse create(long familyId, long userId, EventRequest req) {
        access.requireCanCreateEvents(familyId, userId);
        FamilyEvent event = new FamilyEvent(familyId, userId);
        apply(event, req);
        linkPersons(event, familyId, req.personIds());
        FamilyEvent saved = events.saveAndFlush(event);
        publisher.publishEvent(new EventChanged(saved.getId()));
        return EventResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public EventResponse get(long familyId, long userId, long eventId) {
        access.requireMember(familyId, userId);
        return EventResponse.from(load(familyId, eventId));
    }

    /** The client sends the version it edited; if someone saved in between, 409 instead of overwriting. */
    @Transactional
    public EventResponse update(long familyId, long userId, long eventId, EventRequest req) {
        access.requireMember(familyId, userId);
        FamilyEvent event = load(familyId, eventId);
        access.requireCanEditEvent(familyId, userId, event.getCreatedBy());
        if (req.version() == null || req.version() != event.getVersion()) {
            throw new BusinessException(ErrorCode.VERSION_CONFLICT);
        }
        apply(event, req);
        if (req.personIds() != null) {
            linkPersons(event, familyId, req.personIds());
        }
        events.flush(); // bumps the version now, inside the transaction
        publisher.publishEvent(new EventChanged(event.getId()));
        return EventResponse.from(event);
    }

    @Transactional
    public void delete(long familyId, long userId, long eventId) {
        access.requireMember(familyId, userId);
        FamilyEvent event = load(familyId, eventId);
        access.requireCanEditEvent(familyId, userId, event.getCreatedBy());
        event.delete(Instant.now(clock));
        publisher.publishEvent(new EventChanged(event.getId()));
    }

    /** A live event as other modules (reminders) need it; empty if deleted. */
    @Transactional(readOnly = true)
    public Optional<EventSnapshot> snapshot(long eventId) {
        return events.findById(eventId).filter(e -> !e.isDeleted()).map(EventSnapshot::of);
    }

    /** Every live event of every live family: the nightly reminder planner walks them all. */
    @Transactional(readOnly = true)
    public List<EventSnapshot> liveSnapshots() {
        return events.allLive().stream().map(EventSnapshot::of).toList();
    }

    /** Every occurrence in [from, to], sorted by date then time; optionally one type only. */
    @Transactional(readOnly = true)
    public List<OccurrenceResponse> occurrences(long familyId, long userId, LocalDate from, LocalDate to,
            EventType type) {
        access.requireMember(familyId, userId);
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new BusinessException(ErrorCode.RANGE_TOO_LONG);
        }
        checkYear(from.getYear());
        checkYear(to.getYear());
        List<OccurrenceResponse> out = new ArrayList<>();
        for (FamilyEvent e : events.candidates(familyId, from, to)) {
            if (type != null && e.getType() != type) {
                continue;
            }
            for (OccurrenceCalculator.Occurrence o : OccurrenceCalculator.expand(e.rule(), from, to)) {
                LunarDate l = LunarCalendar.toLunar(o.date());
                out.add(new OccurrenceResponse(e.getId(), o.date(), l.day(), l.month(), l.year(), l.leap(), e.getType(),
                        e.getTitle(), e.getLocation(), e.getStartTime(), e.getCalendarType(), e.getRecurrence(),
                        o.anniversary()));
            }
        }
        out.sort(Comparator.comparing(OccurrenceResponse::date)
                .thenComparing(OccurrenceResponse::startTime, Comparator.nullsFirst(Comparator.naturalOrder())));
        return out;
    }

    /** From today (Vietnam time) for {@code days} days: the Home screen list. */
    @Transactional(readOnly = true)
    public List<OccurrenceResponse> upcoming(long familyId, long userId, int days) {
        int span = Math.max(0, Math.min(days, MAX_UPCOMING_DAYS));
        LocalDate today = LocalDate.now(clock.withZone(ClockConfig.VIETNAM));
        return occurrences(familyId, userId, today, today.plusDays(span), null);
    }

    /** Removes a deleted relative from every event; called by the person module. */
    @Transactional
    public void unlinkPerson(long personId) {
        events.unlinkPerson(personId);
    }

    /** Only live profiles of this same family can be linked (IDOR guard): otherwise 404. */
    private void linkPersons(FamilyEvent event, long familyId, List<Long> ids) {
        Set<Long> wanted = ids == null ? Set.of() : new HashSet<>(ids);
        if (!wanted.isEmpty() && !persons.existingIn(familyId, wanted).containsAll(wanted)) {
            throw new BusinessException(ErrorCode.PERSON_NOT_FOUND);
        }
        event.linkPersons(wanted);
    }

    /** Checks the date combination and fills the derived solar date of lunar events with a known year. */
    private void apply(FamilyEvent event, EventRequest req) {
        Recurrence recurrence = req.recurrence() == null ? Recurrence.NONE : req.recurrence();
        boolean leap = Boolean.TRUE.equals(req.lunarLeapMonth());
        LocalDate solarDate;
        Integer lunarDay = null;
        Integer lunarMonth = null;
        Integer lunarYear = null;
        if (req.calendarType() == CalendarType.SOLAR) {
            if (req.solarDate() == null) {
                throw new BusinessException(ErrorCode.EVENT_DATE_REQUIRED);
            }
            checkYear(req.solarDate().getYear());
            solarDate = req.solarDate();
            leap = false;
        } else {
            if (req.lunarDay() == null || req.lunarMonth() == null
                    || (recurrence == Recurrence.NONE && req.lunarYear() == null)) {
                throw new BusinessException(ErrorCode.EVENT_DATE_REQUIRED);
            }
            lunarDay = req.lunarDay();
            lunarMonth = req.lunarMonth();
            lunarYear = req.lunarYear();
            if (lunarYear == null) {
                solarDate = null;
                leap = false; // no year, no way to know a leap month: the ordinary month it is
            } else {
                checkYear(lunarYear);
                solarDate = LunarCalendar.toSolar(new LunarDate(lunarDay, lunarMonth, lunarYear, leap))
                        .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_LUNAR_DATE));
            }
        }
        event.apply(req.type(), req.title().trim(), blankToNull(req.description()), blankToNull(req.location()),
                req.calendarType(), solarDate, lunarDay, lunarMonth, lunarYear, leap, req.startTime(), recurrence);
    }

    private FamilyEvent load(long familyId, long eventId) {
        return events.findByIdAndFamilyIdAndDeletedAtIsNull(eventId, familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
    }

    private static void checkYear(int year) {
        if (year <= LunarCalendar.MIN_YEAR || year >= LunarCalendar.MAX_YEAR) {
            throw new BusinessException(ErrorCode.DATE_OUT_OF_RANGE);
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

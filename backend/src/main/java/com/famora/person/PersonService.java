package com.famora.person;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.calendar.event.EventDtos.EventRequest;
import com.famora.calendar.event.EventEnums.CalendarType;
import com.famora.calendar.event.EventEnums.EventType;
import com.famora.calendar.event.EventEnums.Recurrence;
import com.famora.calendar.event.EventService;
import com.famora.calendar.lunar.LunarCalendar;
import com.famora.calendar.lunar.LunarDate;
import com.famora.calendar.occurrence.OccurrenceCalculator;
import com.famora.common.config.ClockConfig;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.FamilyAccessService;
import com.famora.family.FamilyRole;
import com.famora.person.PersonDtos.PersonRequest;
import com.famora.person.PersonDtos.PersonResponse;

/** Relatives' profiles: every member reads them, OWNER and ADMIN manage them (permission matrix). */
@Service
public class PersonService {

    private final FamilyPersonRepository persons;
    private final FamilyAccessService access;
    private final EventService events;
    private final Clock clock;

    public PersonService(FamilyPersonRepository persons, FamilyAccessService access, EventService events,
            Clock clock) {
        this.persons = persons;
        this.access = access;
        this.events = events;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<PersonResponse> list(long familyId, long userId) {
        access.requireMember(familyId, userId);
        LocalDate today = today();
        return persons.listOf(familyId).stream().map(p -> response(p, today, null)).toList();
    }

    @Transactional(readOnly = true)
    public PersonResponse get(long familyId, long userId, long personId) {
        access.requireMember(familyId, userId);
        return response(load(familyId, personId), today(), null);
    }

    @Transactional
    public PersonResponse create(long familyId, long userId, PersonRequest req) {
        access.require(familyId, userId, FamilyRole.ADMIN);
        FamilyPerson person = new FamilyPerson(familyId);
        apply(person, familyId, req);
        persons.saveAndFlush(person);
        Long eventId = null;
        if (Boolean.TRUE.equals(req.createAnniversary())) {
            eventId = createAnniversary(familyId, userId, person);
        }
        return response(person, today(), eventId);
    }

    @Transactional
    public PersonResponse update(long familyId, long userId, long personId, PersonRequest req) {
        access.require(familyId, userId, FamilyRole.ADMIN);
        FamilyPerson person = load(familyId, personId);
        apply(person, familyId, req);
        return response(person, today(), null);
    }

    /** Soft delete; events about this relative stay, only their link to the profile is removed. */
    @Transactional
    public void delete(long familyId, long userId, long personId) {
        access.require(familyId, userId, FamilyRole.ADMIN);
        FamilyPerson person = load(familyId, personId);
        person.delete(Instant.now(clock));
        events.unlinkPerson(person.getId());
    }

    private void apply(FamilyPerson person, long familyId, PersonRequest req) {
        boolean deceased = Boolean.TRUE.equals(req.deceased());
        boolean leap = Boolean.TRUE.equals(req.deathLunarLeap());
        boolean anyDeath = req.deathDateSolar() != null || req.deathLunarDay() != null || req.deathLunarMonth() != null;
        if (!deceased && anyDeath) {
            throw new BusinessException(ErrorCode.DEATH_DETAILS_FOR_LIVING);
        }
        if ((req.deathLunarDay() == null) != (req.deathLunarMonth() == null)) {
            throw new BusinessException(ErrorCode.DEATH_DATES_DISAGREE);
        }
        Integer lunarDay = req.deathLunarDay();
        Integer lunarMonth = req.deathLunarMonth();
        if (req.deathDateSolar() != null) {
            // the solar date decides; a lunar date sent along must agree with it
            int year = req.deathDateSolar().getYear();
            if (year <= LunarCalendar.MIN_YEAR || year >= LunarCalendar.MAX_YEAR) {
                throw new BusinessException(ErrorCode.DATE_OUT_OF_RANGE);
            }
            LunarDate l = LunarCalendar.toLunar(req.deathDateSolar());
            if (lunarDay != null && (lunarDay != l.day() || lunarMonth != l.month() || leap != l.leap())) {
                throw new BusinessException(ErrorCode.DEATH_DATES_DISAGREE);
            }
            lunarDay = l.day();
            lunarMonth = l.month();
            leap = l.leap();
        } else if (lunarDay == null) {
            leap = false;
        }
        if (req.memberId() != null) {
            if (!access.isActiveMemberOf(familyId, req.memberId())) {
                throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
            }
            if (persons.memberTaken(req.memberId(), person.getId())) {
                throw new BusinessException(ErrorCode.MEMBER_ALREADY_LINKED);
            }
        }
        person.apply(req.memberId(), req.fullName().trim(), blankToNull(req.nickname()), req.gender(),
                req.birthDateSolar(), deceased, req.deathDateSolar(), lunarDay, lunarMonth, leap);
    }

    /** "Giỗ Bà nội": yearly, lunar, from the year of death when it is known (so the count is right). */
    private Long createAnniversary(long familyId, long userId, FamilyPerson p) {
        if (!p.isDeceased() || p.getDeathLunarDay() == null) {
            throw new BusinessException(ErrorCode.ANNIVERSARY_NEEDS_DATE);
        }
        Integer lunarYear = p.getDeathDateSolar() == null ? null
                : LunarCalendar.toLunar(p.getDeathDateSolar()).year();
        String who = p.getNickname() != null ? p.getNickname() : p.getFullName();
        EventRequest req = new EventRequest(EventType.DEATH_ANNIVERSARY, "Giỗ " + who, null, null, CalendarType.LUNAR,
                null, p.getDeathLunarDay(), p.getDeathLunarMonth(), lunarYear, p.isDeathLunarLeap(), null,
                Recurrence.YEARLY, null, List.of(p.getId()));
        return events.create(familyId, userId, req).id();
    }

    private PersonResponse response(FamilyPerson p, LocalDate today, Long anniversaryEventId) {
        return new PersonResponse(p.getId(), p.getMemberId(), p.getFullName(), p.getNickname(), p.getGender(),
                p.getBirthDateSolar(), p.isDeceased(), p.getDeathDateSolar(), p.getDeathLunarDay(),
                p.getDeathLunarMonth(), p.isDeathLunarLeap(), nextAnniversary(p, today), anniversaryEventId);
    }

    /** The next giỗ from today: day 30 of a short month and leap origins follow the event policies. */
    private static LocalDate nextAnniversary(FamilyPerson p, LocalDate today) {
        if (!p.isDeceased() || p.getDeathLunarDay() == null) {
            return null;
        }
        OccurrenceCalculator.Rule rule = new OccurrenceCalculator.Rule(CalendarType.LUNAR, Recurrence.YEARLY, null,
                p.getDeathLunarDay(), p.getDeathLunarMonth(), null, false);
        return OccurrenceCalculator.expand(rule, today, today.plusDays(400)).stream()
                .map(OccurrenceCalculator.Occurrence::date).findFirst().orElse(null);
    }

    private FamilyPerson load(long familyId, long personId) {
        return persons.findByIdAndFamilyIdAndDeletedAtIsNull(personId, familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NOT_FOUND));
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(ClockConfig.VIETNAM));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

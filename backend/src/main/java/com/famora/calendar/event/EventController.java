package com.famora.calendar.event;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.famora.calendar.event.EventDtos.EventRequest;
import com.famora.calendar.event.EventDtos.EventResponse;
import com.famora.calendar.event.EventDtos.OccurrenceResponse;
import com.famora.calendar.event.EventEnums.EventType;
import com.famora.common.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/families/{familyId}/events")
public class EventController {

    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @Valid @RequestBody EventRequest req) {
        return events.create(familyId, CurrentUser.id(jwt), req);
    }

    /** GET /api/families/1/events?from=2026-11-01&amp;to=2026-11-30[&amp;type=BIRTHDAY]: occurrences, not rules. */
    @GetMapping
    public List<OccurrenceResponse> inRange(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) EventType type) {
        return events.occurrences(familyId, CurrentUser.id(jwt), from, to, type);
    }

    @GetMapping("/upcoming")
    public List<OccurrenceResponse> upcoming(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @RequestParam(defaultValue = "30") int days) {
        return events.upcoming(familyId, CurrentUser.id(jwt), days);
    }

    @GetMapping("/{eventId}")
    public EventResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long eventId) {
        return events.get(familyId, CurrentUser.id(jwt), eventId);
    }

    @PutMapping("/{eventId}")
    public EventResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long eventId, @Valid @RequestBody EventRequest req) {
        return events.update(familyId, CurrentUser.id(jwt), eventId, req);
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId, @PathVariable long eventId) {
        events.delete(familyId, CurrentUser.id(jwt), eventId);
    }
}

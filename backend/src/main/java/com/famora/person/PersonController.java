package com.famora.person;

import java.util.List;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.famora.common.security.CurrentUser;
import com.famora.person.PersonDtos.PersonRequest;
import com.famora.person.PersonDtos.PersonResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/families/{familyId}/persons")
public class PersonController {

    private final PersonService persons;

    public PersonController(PersonService persons) {
        this.persons = persons;
    }

    @GetMapping
    public List<PersonResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        return persons.list(familyId, CurrentUser.id(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @Valid @RequestBody PersonRequest req) {
        return persons.create(familyId, CurrentUser.id(jwt), req);
    }

    @GetMapping("/{personId}")
    public PersonResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long personId) {
        return persons.get(familyId, CurrentUser.id(jwt), personId);
    }

    @PutMapping("/{personId}")
    public PersonResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long personId, @Valid @RequestBody PersonRequest req) {
        return persons.update(familyId, CurrentUser.id(jwt), personId, req);
    }

    @DeleteMapping("/{personId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId, @PathVariable long personId) {
        persons.delete(familyId, CurrentUser.id(jwt), personId);
    }
}

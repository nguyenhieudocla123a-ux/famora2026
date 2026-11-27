package com.famora.person;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.famora.calendar.event.PersonLookup;

/** Answers the event module's questions about profiles without the event module depending on this one. */
@Component
class PersonLookupImpl implements PersonLookup {

    private final FamilyPersonRepository persons;

    PersonLookupImpl(FamilyPersonRepository persons) {
        this.persons = persons;
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> existingIn(long familyId, Collection<Long> ids) {
        return ids.isEmpty() ? Set.of() : new HashSet<>(persons.existingIds(familyId, ids));
    }
}

package com.famora.calendar.event;

import java.util.Collection;
import java.util.Set;

/**
 * What the event module needs to know about relatives' profiles, implemented by the person module.
 * An interface keeps the dependency one-way: person -> event, never event -> person.
 */
public interface PersonLookup {

    /** The ids among {@code ids} that are live profiles of this family. */
    Set<Long> existingIn(long familyId, Collection<Long> ids);
}

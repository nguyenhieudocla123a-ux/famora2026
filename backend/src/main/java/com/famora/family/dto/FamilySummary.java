package com.famora.family.dto;

import com.famora.family.FamilyRole;

/** A family as the caller sees it, including the caller's own role there. */
public record FamilySummary(Long id, String name, String description, FamilyRole myRole, long memberCount,
        boolean memberCanCreateEvents) {
}

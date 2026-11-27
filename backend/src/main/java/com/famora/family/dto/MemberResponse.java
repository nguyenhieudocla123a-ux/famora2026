package com.famora.family.dto;

import java.time.Instant;

import com.famora.family.FamilyRole;

public record MemberResponse(Long id, Long userId, String fullName, String nickname, FamilyRole role,
        Instant joinedAt) {
}

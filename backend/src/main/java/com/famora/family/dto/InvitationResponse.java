package com.famora.family.dto;

import java.time.Instant;

import com.famora.family.FamilyInvitation;
import com.famora.family.FamilyRole;

public record InvitationResponse(Long id, String code, FamilyRole role, int maxUses, int usedCount,
        Instant expiresAt) {

    public static InvitationResponse from(FamilyInvitation i) {
        return new InvitationResponse(i.getId(), i.getCode(), i.getDefaultRole(), i.getMaxUses(), i.getUsedCount(),
                i.getExpiresAt());
    }
}

package com.famora.family;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A code relatives type in to join; limited in uses and time, and revocable. */
@Entity
@Table(name = "family_invitations")
public class FamilyInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(nullable = false, updatable = false, length = 12)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_role", nullable = false, updatable = false, length = 16)
    private FamilyRole defaultRole;

    @Column(name = "max_uses", nullable = false, updatable = false)
    private int maxUses;

    /** Only ever changed by the atomic UPDATE in FamilyInvitationRepository.useOnce. */
    @Column(name = "used_count", nullable = false, insertable = false, updatable = false)
    private int usedCount;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected FamilyInvitation() {
    }

    FamilyInvitation(Long familyId, String code, FamilyRole defaultRole, int maxUses, Instant createdAt,
            Instant expiresAt, Long createdBy) {
        this.familyId = familyId;
        this.code = code;
        this.defaultRole = defaultRole;
        this.maxUses = maxUses;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.createdBy = createdBy;
    }

    void revoke(Instant now) {
        if (revokedAt == null) {
            revokedAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public String getCode() {
        return code;
    }

    public FamilyRole getDefaultRole() {
        return defaultRole;
    }

    public int getMaxUses() {
        return maxUses;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

package com.famora.auth;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One refresh token, stored as its SHA-256 hash. */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "token_hash", nullable = false, updatable = false, length = 64)
    private String tokenHash;

    /** All tokens rotated from one sign-in share this id. */
    @Column(name = "token_family", nullable = false, updatable = false)
    private UUID tokenFamily;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by_id")
    private Long replacedById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshToken() {
    }

    RefreshToken(Long userId, String tokenHash, UUID tokenFamily, Instant createdAt, Instant expiresAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.tokenFamily = tokenFamily;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    boolean isRevoked() {
        return revokedAt != null;
    }

    boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    void revoke(Instant now) {
        if (revokedAt == null) {
            revokedAt = now;
        }
    }

    void replaceWith(RefreshToken next, Instant now) {
        revoke(now);
        replacedById = next.id;
    }

    Long getId() {
        return id;
    }

    Long getUserId() {
        return userId;
    }

    UUID getTokenFamily() {
        return tokenFamily;
    }

    Instant getExpiresAt() {
        return expiresAt;
    }
}

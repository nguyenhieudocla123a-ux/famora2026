package com.famora.auth.google;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Links an outside account (provider + its user id) to a Famora account. */
@Entity
@Table(name = "user_identities")
public class UserIdentity {

    public static final String GOOGLE = "GOOGLE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(nullable = false, updatable = false, length = 16)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, updatable = false, length = 255)
    private String providerUserId;

    /** The email the provider gave when the link was made; for support only, never used to sign in. */
    @Column(length = 254)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserIdentity() {
    }

    public UserIdentity(Long userId, String provider, String providerUserId, String email) {
        this.userId = userId;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.email = email;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getUserId() {
        return userId;
    }
}

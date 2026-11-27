package com.famora.family;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "families")
public class Family {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "member_can_create_events", nullable = false)
    private boolean memberCanCreateEvents = true;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Family() {
    }

    Family(String name, String description, boolean memberCanCreateEvents, Long createdBy) {
        this.name = name;
        this.description = description;
        this.memberCanCreateEvents = memberCanCreateEvents;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    void update(String name, String description, boolean memberCanCreateEvents) {
        this.name = name;
        this.description = description;
        this.memberCanCreateEvents = memberCanCreateEvents;
    }

    void dissolve(Instant now) {
        deletedAt = now;
    }

    boolean isDeleted() {
        return deletedAt != null;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public boolean isMemberCanCreateEvents() {
        return memberCanCreateEvents;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

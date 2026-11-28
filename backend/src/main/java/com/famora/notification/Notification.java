package com.famora.notification;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One in-app notification for one user. */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "family_id", updatable = false)
    private Long familyId;

    @Column(nullable = false, updatable = false, length = 32)
    private String type;

    @Column(nullable = false, updatable = false, length = 200)
    private String title;

    @Column(nullable = false, updatable = false, length = 500)
    private String body;

    @Column(name = "ref_type", updatable = false, length = 32)
    private String refType;

    @Column(name = "ref_id", updatable = false)
    private Long refId;

    /** For a reminder: the occurrence date it is about. */
    @Column(name = "ref_date", updatable = false)
    private LocalDate refDate;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Notification() {
    }

    Notification(Long userId, Long familyId, String type, String title, String body, String refType, Long refId,
            LocalDate refDate, Instant createdAt) {
        this.userId = userId;
        this.familyId = familyId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.refType = refType;
        this.refId = refId;
        this.refDate = refDate;
        this.createdAt = createdAt;
    }

    void markRead(Instant now) {
        if (readAt == null) {
            readAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public String getRefType() {
        return refType;
    }

    public Long getRefId() {
        return refId;
    }

    public LocalDate getRefDate() {
        return refDate;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

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

/** One person's membership in one family, with the role they hold there. */
@Entity
@Table(name = "family_members")
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FamilyRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MemberStatus status = MemberStatus.ACTIVE;

    @Column(length = 50)
    private String nickname;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    protected FamilyMember() {
    }

    FamilyMember(Long familyId, Long userId, FamilyRole role, String nickname, Instant joinedAt) {
        this.familyId = familyId;
        this.userId = userId;
        this.role = role;
        this.nickname = nickname;
        this.joinedAt = joinedAt;
    }

    void changeRole(FamilyRole role) {
        this.role = role;
    }

    void end(MemberStatus how, Instant now) {
        this.status = how;
        this.leftAt = now;
    }

    public Long getId() {
        return id;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public Long getUserId() {
        return userId;
    }

    public FamilyRole getRole() {
        return role;
    }

    public MemberStatus getStatus() {
        return status;
    }

    public String getNickname() {
        return nickname;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}

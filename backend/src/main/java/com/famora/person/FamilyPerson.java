package com.famora.person;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/** A relative's profile: someone the family remembers, with or without an account of their own. */
@Entity
@Table(name = "family_persons")
public class FamilyPerson {

    public enum Gender {
        MALE,
        FEMALE,
        OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(length = 8)
    private Gender gender;

    @Column(name = "birth_date_solar")
    private LocalDate birthDateSolar;

    @Column(name = "is_deceased", nullable = false)
    private boolean deceased;

    @Column(name = "death_date_solar")
    private LocalDate deathDateSolar;

    @Column(name = "death_lunar_day")
    private Short deathLunarDay;

    @Column(name = "death_lunar_month")
    private Short deathLunarMonth;

    @Column(name = "death_lunar_leap", nullable = false)
    private boolean deathLunarLeap;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FamilyPerson() {
    }

    FamilyPerson(Long familyId) {
        this.familyId = familyId;
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

    /** Every editable field at once; the service has already checked the combination. */
    void apply(Long memberId, String fullName, String nickname, Gender gender, LocalDate birthDateSolar,
            boolean deceased, LocalDate deathDateSolar, Integer deathLunarDay, Integer deathLunarMonth,
            boolean deathLunarLeap) {
        this.memberId = memberId;
        this.fullName = fullName;
        this.nickname = nickname;
        this.gender = gender;
        this.birthDateSolar = birthDateSolar;
        this.deceased = deceased;
        this.deathDateSolar = deathDateSolar;
        this.deathLunarDay = deathLunarDay == null ? null : deathLunarDay.shortValue();
        this.deathLunarMonth = deathLunarMonth == null ? null : deathLunarMonth.shortValue();
        this.deathLunarLeap = deathLunarLeap;
    }

    void delete(Instant now) {
        deletedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getNickname() {
        return nickname;
    }

    public Gender getGender() {
        return gender;
    }

    public LocalDate getBirthDateSolar() {
        return birthDateSolar;
    }

    public boolean isDeceased() {
        return deceased;
    }

    public LocalDate getDeathDateSolar() {
        return deathDateSolar;
    }

    public Integer getDeathLunarDay() {
        return deathLunarDay == null ? null : deathLunarDay.intValue();
    }

    public Integer getDeathLunarMonth() {
        return deathLunarMonth == null ? null : deathLunarMonth.intValue();
    }

    public boolean isDeathLunarLeap() {
        return deathLunarLeap;
    }
}

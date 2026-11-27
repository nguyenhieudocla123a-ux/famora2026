package com.famora.family;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, Long> {

    Optional<FamilyInvitation> findByCode(String code);

    boolean existsByCode(String code);

    Optional<FamilyInvitation> findByIdAndFamilyId(Long id, Long familyId);

    /** Codes that can still be used: not revoked, not expired, uses left. */
    @Query("""
            select i from FamilyInvitation i
            where i.familyId = :familyId and i.revokedAt is null and i.expiresAt > :now and i.usedCount < i.maxUses
            order by i.createdAt desc
            """)
    List<FamilyInvitation> listUsable(@Param("familyId") Long familyId, @Param("now") Instant now);

    /**
     * Takes one use of the code in a single atomic statement. If two people send the last use at the same
     * moment, PostgreSQL runs the updates one after the other and the second finds no row left: returns 0.
     */
    @Modifying
    @Query("""
            update FamilyInvitation i set i.usedCount = i.usedCount + 1
            where i.id = :id and i.revokedAt is null and i.expiresAt > :now and i.usedCount < i.maxUses
            """)
    int useOnce(@Param("id") Long id, @Param("now") Instant now);
}

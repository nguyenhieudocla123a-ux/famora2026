package com.famora.person;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface FamilyPersonRepository extends JpaRepository<FamilyPerson, Long> {

    Optional<FamilyPerson> findByIdAndFamilyIdAndDeletedAtIsNull(Long id, Long familyId);

    /** The living first, then the departed; each group by name. */
    @Query("""
            select p from FamilyPerson p where p.familyId = :familyId and p.deletedAt is null
            order by p.deceased, p.fullName
            """)
    List<FamilyPerson> listOf(@Param("familyId") Long familyId);

    @Query("select p.id from FamilyPerson p where p.familyId = :familyId and p.deletedAt is null and p.id in :ids")
    List<Long> existingIds(@Param("familyId") Long familyId, @Param("ids") Collection<Long> ids);

    @Query("""
            select count(p) > 0 from FamilyPerson p
            where p.memberId = :memberId and p.deletedAt is null and (:exceptId is null or p.id <> :exceptId)
            """)
    boolean memberTaken(@Param("memberId") Long memberId, @Param("exceptId") Long exceptId);
}

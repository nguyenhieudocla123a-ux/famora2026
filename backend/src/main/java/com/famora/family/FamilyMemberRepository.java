package com.famora.family;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.famora.family.dto.FamilySummary;
import com.famora.family.dto.MemberResponse;

interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    /** The caller's active membership in a family that still exists; empty means "not a member" (404). */
    @Query("""
            select m from FamilyMember m, Family f
            where f.id = m.familyId and f.deletedAt is null
              and m.familyId = :familyId and m.userId = :userId and m.status = com.famora.family.MemberStatus.ACTIVE
            """)
    Optional<FamilyMember> findActive(@Param("familyId") Long familyId, @Param("userId") Long userId);

    /** IDOR guard: a member id only counts inside the family named in the URL. */
    @Query("""
            select m from FamilyMember m
            where m.id = :memberId and m.familyId = :familyId and m.status = com.famora.family.MemberStatus.ACTIVE
            """)
    Optional<FamilyMember> findActiveInFamily(@Param("memberId") Long memberId, @Param("familyId") Long familyId);

    @Query("""
            select new com.famora.family.dto.MemberResponse(m.id, m.userId, u.fullName, m.nickname, m.role, m.joinedAt)
            from FamilyMember m, com.famora.user.User u
            where u.id = m.userId and m.familyId = :familyId and m.status = com.famora.family.MemberStatus.ACTIVE
            order by case when m.role = com.famora.family.FamilyRole.OWNER then 0
                          when m.role = com.famora.family.FamilyRole.ADMIN then 1 else 2 end,
                     m.joinedAt
            """)
    List<MemberResponse> listActive(@Param("familyId") Long familyId);

    /** One query for the "my families" screen, with each family's member count. */
    @Query("""
            select new com.famora.family.dto.FamilySummary(f.id, f.name, f.description, m.role,
                (select count(x) from FamilyMember x
                 where x.familyId = f.id and x.status = com.famora.family.MemberStatus.ACTIVE),
                f.memberCanCreateEvents)
            from FamilyMember m, Family f
            where f.id = m.familyId and f.deletedAt is null
              and m.userId = :userId and m.status = com.famora.family.MemberStatus.ACTIVE
            order by m.joinedAt
            """)
    List<FamilySummary> listFamiliesOf(@Param("userId") Long userId);

    @Query("select count(m) from FamilyMember m where m.familyId = :familyId and m.status = com.famora.family.MemberStatus.ACTIVE")
    long countActive(@Param("familyId") Long familyId);
}

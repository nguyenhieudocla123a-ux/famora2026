package com.famora.family;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.dto.MemberResponse;

/**
 * Members and roles, following the permission matrix of the Phase 1 design:
 * <ul>
 * <li>Only the OWNER changes roles (MEMBER and ADMIN) and transfers ownership.</li>
 * <li>The OWNER removes anyone; an ADMIN removes only MEMBERs.</li>
 * <li>Nobody changes or removes the OWNER; the OWNER cannot leave before handing ownership over.</li>
 * </ul>
 */
@Service
public class MemberService {

    private final FamilyMemberRepository members;
    private final FamilyAccessService access;
    private final Clock clock;

    public MemberService(FamilyMemberRepository members, FamilyAccessService access, Clock clock) {
        this.members = members;
        this.access = access;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> list(long familyId, long userId) {
        access.requireMember(familyId, userId);
        return members.listActive(familyId);
    }

    @Transactional
    public void changeRole(long familyId, long userId, long memberId, FamilyRole newRole) {
        FamilyMember me = access.require(familyId, userId, FamilyRole.OWNER);
        FamilyMember target = target(familyId, memberId);
        if (target.getId().equals(me.getId()) || target.getRole() == FamilyRole.OWNER || newRole == FamilyRole.OWNER) {
            throw new BusinessException(ErrorCode.OWNER_IS_PROTECTED);
        }
        target.changeRole(newRole);
    }

    @Transactional
    public void remove(long familyId, long userId, long memberId) {
        FamilyMember me = access.require(familyId, userId, FamilyRole.ADMIN);
        FamilyMember target = target(familyId, memberId);
        if (target.getId().equals(me.getId())) {
            throw new BusinessException(ErrorCode.NOT_ON_YOURSELF);
        }
        if (target.getRole() == FamilyRole.OWNER) {
            throw new BusinessException(ErrorCode.OWNER_IS_PROTECTED);
        }
        if (me.getRole() == FamilyRole.ADMIN && target.getRole() != FamilyRole.MEMBER) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        target.end(MemberStatus.REMOVED, Instant.now(clock));
    }

    @Transactional
    public void leave(long familyId, long userId) {
        FamilyMember me = access.requireMember(familyId, userId);
        if (me.getRole() == FamilyRole.OWNER) {
            throw new BusinessException(ErrorCode.OWNER_MUST_TRANSFER);
        }
        me.end(MemberStatus.LEFT, Instant.now(clock));
    }

    /**
     * One transaction: the old owner becomes ADMIN first and is written to the database, then the new owner is
     * promoted. In the other order the "one owner per family" index would reject the change.
     */
    @Transactional
    public void transferOwnership(long familyId, long userId, long memberId) {
        FamilyMember me = access.require(familyId, userId, FamilyRole.OWNER);
        FamilyMember target = target(familyId, memberId);
        if (target.getId().equals(me.getId())) {
            throw new BusinessException(ErrorCode.NOT_ON_YOURSELF);
        }
        me.changeRole(FamilyRole.ADMIN);
        members.saveAndFlush(me);
        target.changeRole(FamilyRole.OWNER);
        members.saveAndFlush(target);
    }

    /** A member id from the URL counts only inside that same family (IDOR guard): otherwise 404. */
    private FamilyMember target(long familyId, long memberId) {
        return members.findActiveInFamily(memberId, familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}

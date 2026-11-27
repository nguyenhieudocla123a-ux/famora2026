package com.famora.family;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.dto.FamilyRequests;
import com.famora.family.dto.FamilySummary;

/** Creating, reading, editing and dissolving families. Every method checks access first. */
@Service
public class FamilyService {

    private final FamilyRepository families;
    private final FamilyMemberRepository members;
    private final FamilyAccessService access;
    private final Clock clock;

    public FamilyService(FamilyRepository families, FamilyMemberRepository members, FamilyAccessService access,
            Clock clock) {
        this.families = families;
        this.members = members;
        this.access = access;
        this.clock = clock;
    }

    /** The creator becomes OWNER in the same transaction, so a family never exists without its owner. */
    @Transactional
    public FamilySummary create(long userId, FamilyRequests.CreateFamily req) {
        boolean memberCanCreate = req.memberCanCreateEvents() == null || req.memberCanCreateEvents();
        Family family = families.save(new Family(req.name().trim(), blankToNull(req.description()), memberCanCreate,
                userId));
        members.save(new FamilyMember(family.getId(), userId, FamilyRole.OWNER, blankToNull(req.nickname()),
                Instant.now(clock)));
        return summary(family, FamilyRole.OWNER, 1);
    }

    @Transactional(readOnly = true)
    public List<FamilySummary> listMine(long userId) {
        return members.listFamiliesOf(userId);
    }

    @Transactional(readOnly = true)
    public FamilySummary get(long familyId, long userId) {
        FamilyMember me = access.requireMember(familyId, userId);
        return summary(load(familyId), me.getRole(), members.countActive(familyId));
    }

    @Transactional
    public FamilySummary update(long familyId, long userId, FamilyRequests.UpdateFamily req) {
        FamilyMember me = access.require(familyId, userId, FamilyRole.ADMIN);
        Family family = load(familyId);
        family.update(req.name().trim(), blankToNull(req.description()), req.memberCanCreateEvents());
        return summary(family, me.getRole(), members.countActive(familyId));
    }

    /** Soft delete: the family disappears for everyone, invitation codes stop working, history is kept. */
    @Transactional
    public void dissolve(long familyId, long userId) {
        access.require(familyId, userId, FamilyRole.OWNER);
        load(familyId).dissolve(Instant.now(clock));
    }

    private Family load(long familyId) {
        return families.findByIdAndDeletedAtIsNull(familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND));
    }

    private static FamilySummary summary(Family f, FamilyRole myRole, long memberCount) {
        return new FamilySummary(f.getId(), f.getName(), f.getDescription(), myRole, memberCount,
                f.isMemberCanCreateEvents());
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

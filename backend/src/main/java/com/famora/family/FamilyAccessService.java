package com.famora.family;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

/**
 * The one place that answers "may this user do this in this family?".
 * <ul>
 * <li>Not an active member (or the family is gone): 404, so outsiders cannot even learn the family exists.</li>
 * <li>A member whose role is too low: 403.</li>
 * </ul>
 * Other modules (events, persons, reminders) call this before touching anything inside a family.
 */
@Service("familyAccess")
public class FamilyAccessService {

    private final FamilyMemberRepository members;
    private final FamilyRepository families;

    public FamilyAccessService(FamilyMemberRepository members, FamilyRepository families) {
        this.members = members;
        this.families = families;
    }

    /** Returns the caller's membership if their role is at least {@code minimum}. */
    @Transactional(readOnly = true)
    public FamilyMember require(long familyId, long userId, FamilyRole minimum) {
        FamilyMember me = members.findActive(familyId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND));
        if (!me.getRole().atLeast(minimum)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return me;
    }

    @Transactional(readOnly = true)
    public FamilyMember requireMember(long familyId, long userId) {
        return require(familyId, userId, FamilyRole.MEMBER);
    }

    /** OWNER and ADMIN always; a MEMBER only when the family allows members to add events. */
    @Transactional(readOnly = true)
    public FamilyMember requireCanCreateEvents(long familyId, long userId) {
        FamilyMember me = requireMember(familyId, userId);
        boolean allowed = me.getRole().atLeast(FamilyRole.ADMIN)
                || families.findById(familyId).map(Family::isMemberCanCreateEvents).orElse(false);
        if (!allowed) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return me;
    }

    /** OWNER and ADMIN edit every event; a MEMBER only the events they created. */
    @Transactional(readOnly = true)
    public FamilyMember requireCanEditEvent(long familyId, long userId, long eventCreatorId) {
        FamilyMember me = requireMember(familyId, userId);
        if (!me.getRole().atLeast(FamilyRole.ADMIN) && eventCreatorId != userId) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return me;
    }
}

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

    public FamilyAccessService(FamilyMemberRepository members) {
        this.members = members;
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
}

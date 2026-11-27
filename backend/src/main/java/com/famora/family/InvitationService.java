package com.famora.family;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.family.dto.FamilyRequests;
import com.famora.family.dto.FamilySummary;
import com.famora.family.dto.InvitationResponse;

/** Invitation codes: OWNER and ADMIN create and revoke them; any signed-in user can join with one. */
@Service
public class InvitationService {

    /** No 0/O, 1/I/L: a grandparent reads the code over the phone without confusion. */
    private static final char[] ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ".toCharArray();
    private static final int CODE_LENGTH = 8;
    private static final int DEFAULT_MAX_USES = 5;
    private static final int DEFAULT_VALID_DAYS = 7;

    private final FamilyInvitationRepository invitations;
    private final FamilyRepository families;
    private final FamilyMemberRepository members;
    private final FamilyAccessService access;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public InvitationService(FamilyInvitationRepository invitations, FamilyRepository families,
            FamilyMemberRepository members, FamilyAccessService access, Clock clock) {
        this.invitations = invitations;
        this.families = families;
        this.members = members;
        this.access = access;
        this.clock = clock;
    }

    /** An ADMIN may only invite MEMBERs; inviting ADMINs is the OWNER's call, like promoting someone. */
    @Transactional
    public InvitationResponse create(long familyId, long userId, FamilyRequests.CreateInvitation req) {
        FamilyRole role = req.role() == null ? FamilyRole.MEMBER : req.role();
        FamilyRole needed = role == FamilyRole.MEMBER ? FamilyRole.ADMIN : FamilyRole.OWNER;
        access.require(familyId, userId, needed);
        if (role == FamilyRole.OWNER) {
            throw new BusinessException(ErrorCode.OWNER_IS_PROTECTED);
        }
        Instant now = Instant.now(clock);
        int maxUses = req.maxUses() == null ? DEFAULT_MAX_USES : req.maxUses();
        int days = req.validDays() == null ? DEFAULT_VALID_DAYS : req.validDays();
        FamilyInvitation saved = invitations.save(new FamilyInvitation(familyId, newCode(), role, maxUses, now,
                now.plus(Duration.ofDays(days)), userId));
        return InvitationResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listUsable(long familyId, long userId) {
        access.require(familyId, userId, FamilyRole.ADMIN);
        return invitations.listUsable(familyId, Instant.now(clock)).stream().map(InvitationResponse::from).toList();
    }

    @Transactional
    public void revoke(long familyId, long userId, long invitationId) {
        access.require(familyId, userId, FamilyRole.ADMIN);
        invitations.findByIdAndFamilyId(invitationId, familyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND))
                .revoke(Instant.now(clock));
    }

    /**
     * Joins with a code. Every reason a code fails (unknown, revoked, expired, used up, family dissolved) gives
     * the same answer, so codes cannot be probed one reason at a time.
     */
    @Transactional
    public FamilySummary join(long userId, FamilyRequests.Join req) {
        Instant now = Instant.now(clock);
        FamilyInvitation inv = invitations.findByCode(normalise(req.code()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_INVALID));
        Family family = families.findByIdAndDeletedAtIsNull(inv.getFamilyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_INVALID));
        if (members.findActive(family.getId(), userId).isPresent()) {
            throw new BusinessException(ErrorCode.ALREADY_MEMBER);
        }
        if (invitations.useOnce(inv.getId(), now) == 0) {
            throw new BusinessException(ErrorCode.INVITATION_INVALID);
        }
        members.save(new FamilyMember(family.getId(), userId, inv.getDefaultRole(),
                FamilyService.blankToNull(req.nickname()), now));
        return new FamilySummary(family.getId(), family.getName(), family.getDescription(), inv.getDefaultRole(),
                members.countActive(family.getId()), family.isMemberCanCreateEvents());
    }

    /** People type codes with spaces, dashes and lower case: "k7mq 2xhp" is K7MQ2XHP. */
    static String normalise(String code) {
        return code.replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);
    }

    private String newCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
            }
            String code = sb.toString();
            if (!invitations.existsByCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique invitation code");
    }
}

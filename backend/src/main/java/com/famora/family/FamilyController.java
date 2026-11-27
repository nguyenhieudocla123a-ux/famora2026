package com.famora.family;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.famora.common.security.CurrentUser;
import com.famora.family.dto.FamilyRequests;
import com.famora.family.dto.FamilySummary;
import com.famora.family.dto.InvitationResponse;
import com.famora.family.dto.MemberResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyService families;
    private final MemberService members;
    private final InvitationService invitations;

    public FamilyController(FamilyService families, MemberService members, InvitationService invitations) {
        this.families = families;
        this.members = members;
        this.invitations = invitations;
    }

    // ---- families

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FamilySummary create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody FamilyRequests.CreateFamily req) {
        return families.create(CurrentUser.id(jwt), req);
    }

    @GetMapping
    public List<FamilySummary> mine(@AuthenticationPrincipal Jwt jwt) {
        return families.listMine(CurrentUser.id(jwt));
    }

    @GetMapping("/{familyId}")
    public FamilySummary get(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        return families.get(familyId, CurrentUser.id(jwt));
    }

    @PutMapping("/{familyId}")
    public FamilySummary update(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @Valid @RequestBody FamilyRequests.UpdateFamily req) {
        return families.update(familyId, CurrentUser.id(jwt), req);
    }

    @DeleteMapping("/{familyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void dissolve(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        families.dissolve(familyId, CurrentUser.id(jwt));
    }

    // ---- members

    @GetMapping("/{familyId}/members")
    public List<MemberResponse> members(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        return members.list(familyId, CurrentUser.id(jwt));
    }

    @PatchMapping("/{familyId}/members/{memberId}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId, @PathVariable long memberId,
            @Valid @RequestBody FamilyRequests.ChangeRole req) {
        members.changeRole(familyId, CurrentUser.id(jwt), memberId, req.role());
    }

    @DeleteMapping("/{familyId}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long memberId) {
        members.remove(familyId, CurrentUser.id(jwt), memberId);
    }

    @PostMapping("/{familyId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        members.leave(familyId, CurrentUser.id(jwt));
    }

    @PostMapping("/{familyId}/transfer-ownership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void transferOwnership(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @Valid @RequestBody FamilyRequests.TransferOwnership req) {
        members.transferOwnership(familyId, CurrentUser.id(jwt), req.memberId());
    }

    // ---- invitations

    @PostMapping("/{familyId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public InvitationResponse createInvitation(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @Valid @RequestBody FamilyRequests.CreateInvitation req) {
        return invitations.create(familyId, CurrentUser.id(jwt), req);
    }

    @GetMapping("/{familyId}/invitations")
    public List<InvitationResponse> invitations(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId) {
        return invitations.listUsable(familyId, CurrentUser.id(jwt));
    }

    @DeleteMapping("/{familyId}/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeInvitation(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long invitationId) {
        invitations.revoke(familyId, CurrentUser.id(jwt), invitationId);
    }

    @PostMapping("/join")
    public FamilySummary join(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody FamilyRequests.Join req) {
        return invitations.join(CurrentUser.id(jwt), req);
    }
}

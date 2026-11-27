package com.famora.family;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.famora.support.IntegrationTest;
import com.famora.support.TestApi;

/**
 * The permission matrix of the Phase 1 design, one test per cell that matters.
 * Each test builds its own family: OWNER "Bố", ADMIN "Mẹ", MEMBER "Con", and an OUTSIDER.
 */
class FamilyPermissionTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    TestApi api;
    String owner;
    String admin;
    String member;
    String outsider;
    long familyId;
    long ownerMemberId;
    long adminMemberId;
    long memberMemberId;

    @BeforeEach
    void buildFamily() throws Exception {
        api = new TestApi(mvc);
        owner = api.newUser("Nguyễn Văn Hùng");
        admin = api.newUser("Trần Thị Lan");
        member = api.newUser("Nguyễn Văn Hiếu");
        outsider = api.newUser("Người Lạ");

        familyId = ((Number) TestApi.read(api.post(owner, "/api/families",
                        "{\"name\": \"Gia đình họ Nguyễn\", \"nickname\": \"Bố\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.myRole").value("OWNER")), "$.id")).longValue();

        String adminCode = invite(owner, "ADMIN", 1);
        String memberCode = invite(owner, "MEMBER", 5);
        join(admin, adminCode).andExpect(status().isOk()).andExpect(jsonPath("$.myRole").value("ADMIN"));
        join(member, memberCode).andExpect(status().isOk()).andExpect(jsonPath("$.myRole").value("MEMBER"));

        List<Number> ids = TestApi.read(api.get(owner, base() + "/members"), "$[*].id");
        List<String> roles = TestApi.read(api.get(owner, base() + "/members"), "$[*].role");
        assertThat(roles).containsExactly("OWNER", "ADMIN", "MEMBER");
        ownerMemberId = ids.get(0).longValue();
        adminMemberId = ids.get(1).longValue();
        memberMemberId = ids.get(2).longValue();
    }

    @Nested
    @DisplayName("Người ngoài gia đình: luôn 404, không biết gia đình có tồn tại")
    class Outsider {

        @Test
        void cannotSeeAnything() throws Exception {
            api.get(outsider, base()).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("FAMILY_NOT_FOUND"));
            api.get(outsider, base() + "/members").andExpect(status().isNotFound());
            api.put(outsider, base(), update("Đổi tên")).andExpect(status().isNotFound());
            api.post(outsider, base() + "/invitations", "{}").andExpect(status().isNotFound());
            api.delete(outsider, base()).andExpect(status().isNotFound());
            api.delete(outsider, base() + "/members/" + memberMemberId).andExpect(status().isNotFound());
        }

        @Test
        void unknownFamilyLooksTheSame() throws Exception {
            api.get(outsider, "/api/families/999999").andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("FAMILY_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("MEMBER: xem được, không quản lý được (403)")
    class Member {

        @Test
        void canRead() throws Exception {
            api.get(member, base()).andExpect(status().isOk()).andExpect(jsonPath("$.myRole").value("MEMBER"))
                    .andExpect(jsonPath("$.memberCount").value(3));
            api.get(member, base() + "/members").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
        }

        @Test
        void cannotManage() throws Exception {
            api.put(member, base(), update("Đổi tên")).andExpect(status().isForbidden());
            api.post(member, base() + "/invitations", "{}").andExpect(status().isForbidden());
            api.get(member, base() + "/invitations").andExpect(status().isForbidden());
            api.patch(member, base() + "/members/" + adminMemberId + "/role", role("MEMBER")).andExpect(status().isForbidden());
            api.delete(member, base() + "/members/" + adminMemberId).andExpect(status().isForbidden());
            api.post(member, base() + "/transfer-ownership", transfer(memberMemberId)).andExpect(status().isForbidden());
            api.delete(member, base()).andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("ADMIN: sửa gia đình, mời MEMBER, xoá MEMBER; không đụng tới ADMIN/OWNER")
    class Admin {

        @Test
        void canEditAndInviteMembers() throws Exception {
            api.put(admin, base(), update("Nhà nội Nam Định")).andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Nhà nội Nam Định"));
            api.post(admin, base() + "/invitations", "{\"role\": \"MEMBER\"}").andExpect(status().isCreated());
        }

        @Test
        void cannotInviteAdminsOrChangeRoles() throws Exception {
            api.post(admin, base() + "/invitations", "{\"role\": \"ADMIN\"}").andExpect(status().isForbidden());
            api.patch(admin, base() + "/members/" + memberMemberId + "/role", role("ADMIN")).andExpect(status().isForbidden());
            api.post(admin, base() + "/transfer-ownership", transfer(adminMemberId)).andExpect(status().isForbidden());
            api.delete(admin, base()).andExpect(status().isForbidden());
        }

        @Test
        void removesMembersOnly() throws Exception {
            api.delete(admin, base() + "/members/" + ownerMemberId).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("OWNER_IS_PROTECTED"));
            api.delete(admin, base() + "/members/" + memberMemberId).andExpect(status().isNoContent());
            api.get(member, base()).andExpect(status().isNotFound());
        }

        @Test
        void cannotRemoveAnotherAdmin() throws Exception {
            api.patch(owner, base() + "/members/" + memberMemberId + "/role", role("ADMIN")).andExpect(status().isNoContent());
            api.delete(admin, base() + "/members/" + memberMemberId).andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("OWNER: toàn quyền, nhưng chủ nhà luôn được bảo vệ")
    class Owner {

        @Test
        void changesRoles() throws Exception {
            api.patch(owner, base() + "/members/" + memberMemberId + "/role", role("ADMIN")).andExpect(status().isNoContent());
            api.get(member, base()).andExpect(jsonPath("$.myRole").value("ADMIN"));
            api.patch(owner, base() + "/members/" + memberMemberId + "/role", role("OWNER")).andExpect(status().isConflict());
            api.patch(owner, base() + "/members/" + ownerMemberId + "/role", role("MEMBER")).andExpect(status().isConflict());
        }

        @Test
        void removesAdmins() throws Exception {
            api.delete(owner, base() + "/members/" + adminMemberId).andExpect(status().isNoContent());
            api.delete(owner, base() + "/members/" + ownerMemberId).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("NOT_ON_YOURSELF"));
        }

        @Test
        void cannotLeaveBeforeTransfer() throws Exception {
            api.post(owner, base() + "/leave", null).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("OWNER_MUST_TRANSFER"));
        }

        @Test
        void transfersOwnershipInOneStep() throws Exception {
            api.post(owner, base() + "/transfer-ownership", transfer(adminMemberId)).andExpect(status().isNoContent());
            api.get(admin, base()).andExpect(jsonPath("$.myRole").value("OWNER"));
            api.get(owner, base()).andExpect(jsonPath("$.myRole").value("ADMIN"));
            Integer owners = jdbc.queryForObject("select count(*) from family_members where family_id = ? "
                    + "and role = 'OWNER' and status = 'ACTIVE'", Integer.class, familyId);
            assertThat(owners).isEqualTo(1);
            // the former owner may now leave
            api.post(owner, base() + "/leave", null).andExpect(status().isNoContent());
        }

        @Test
        void dissolves() throws Exception {
            String code = invite(owner, "MEMBER", 5);
            api.delete(owner, base()).andExpect(status().isNoContent());
            api.get(owner, base()).andExpect(status().isNotFound());
            api.get(member, base()).andExpect(status().isNotFound());
            join(outsider, code).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INVITATION_INVALID"));
            api.get(member, "/api/families").andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Mã mời")
    class Invitations {

        @Test
        void joinNormalisesTheCode() throws Exception {
            String code = invite(owner, "MEMBER", 5);
            String typed = code.substring(0, 4).toLowerCase() + " - " + code.substring(4).toLowerCase();
            join(outsider, typed).andExpect(status().isOk()).andExpect(jsonPath("$.memberCount").value(4));
        }

        @Test
        void alreadyMemberIsConflict() throws Exception {
            join(member, invite(owner, "MEMBER", 5)).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("ALREADY_MEMBER"));
        }

        @Test
        void usedUpRevokedExpiredOrUnknownAllLookTheSame() throws Exception {
            String once = invite(owner, "MEMBER", 1);
            join(outsider, once).andExpect(status().isOk());
            join(api.newUser("Khách 2"), once).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("INVITATION_INVALID"));

            long revokedId = ((Number) TestApi.read(api.post(owner, base() + "/invitations", "{}"), "$.id")).longValue();
            String revoked = jdbc.queryForObject("select code from family_invitations where id = ?", String.class, revokedId);
            api.delete(owner, base() + "/invitations/" + revokedId).andExpect(status().isNoContent());
            join(api.newUser("Khách 3"), revoked).andExpect(status().isNotFound());

            String expired = invite(owner, "MEMBER", 5);
            jdbc.update("update family_invitations set expires_at = now() - interval '1 minute' where code = ?", expired);
            join(api.newUser("Khách 4"), expired).andExpect(status().isNotFound());

            join(api.newUser("Khách 5"), "ZZZZZZZZ").andExpect(status().isNotFound());
        }

        @Test
        void listShowsOnlyUsableCodes() throws Exception {
            // buildFamily used the single-use ADMIN code; the MEMBER code still has 4 uses left
            api.get(admin, base() + "/invitations").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].usedCount").value(1));
        }

        @Test
        void leftMemberCanComeBack() throws Exception {
            api.post(member, base() + "/leave", null).andExpect(status().isNoContent());
            api.get(member, base()).andExpect(status().isNotFound());
            join(member, invite(owner, "MEMBER", 5)).andExpect(status().isOk());
            api.get(member, base()).andExpect(status().isOk());
        }

        @Test
        void memberIdFromAnotherFamilyIsNotFound() throws Exception {
            long otherFamily = ((Number) TestApi.read(api.post(outsider, "/api/families", "{\"name\": \"Nhà khác\"}"),
                    "$.id")).longValue();
            // the owner of family A tries to remove a member id that belongs to family A, through family B's URL
            api.delete(outsider, "/api/families/" + otherFamily + "/members/" + memberMemberId)
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MEMBER_NOT_FOUND"));
        }
    }

    @Test
    @DisplayName("Database tự chặn gia đình có hai OWNER")
    void databaseRefusesSecondOwner() {
        assertThatThrownBy(() -> jdbc.update(
                "update family_members set role = 'OWNER' where id = ?", adminMemberId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Danh sách gia đình của tôi kèm vai trò và số thành viên")
    void myFamilies() throws Exception {
        api.get(admin, "/api/families").andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Gia đình họ Nguyễn"))
                .andExpect(jsonPath("$[0].myRole").value("ADMIN"))
                .andExpect(jsonPath("$[0].memberCount").value(3));
    }

    private String base() {
        return "/api/families/" + familyId;
    }

    private String invite(String token, String role, int maxUses) throws Exception {
        return TestApi.read(api.post(token, base() + "/invitations",
                "{\"role\": \"%s\", \"maxUses\": %d}".formatted(role, maxUses)).andExpect(status().isCreated()), "$.code");
    }

    private org.springframework.test.web.servlet.ResultActions join(String token, String code) throws Exception {
        return api.post(token, "/api/families/join", "{\"code\": \"%s\"}".formatted(code));
    }

    private static String update(String name) {
        return "{\"name\": \"%s\", \"memberCanCreateEvents\": true}".formatted(name);
    }

    private static String role(String role) {
        return "{\"role\": \"%s\"}".formatted(role);
    }

    private static String transfer(long memberId) {
        return "{\"memberId\": %d}".formatted(memberId);
    }
}

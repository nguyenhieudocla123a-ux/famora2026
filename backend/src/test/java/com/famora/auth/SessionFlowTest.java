package com.famora.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.famora.support.IntegrationTest;
import com.jayway.jsonpath.JsonPath;

/** Phase 4a: refresh-token rotation and reuse detection, logout, profile and password change. */
class SessionFlowTest extends IntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    private String email;

    @BeforeEach
    void signUp() throws Exception {
        email = "s" + UUID.randomUUID().toString().substring(0, 8) + "@famora.example";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"email": "%s", "password": "%s", "fullName": "Nguyễn Thị Mai"}
                """.formatted(email, PASSWORD))).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Đăng nhập trả cả access lẫn refresh token")
    void loginReturnsBothTokens() throws Exception {
        login(email, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshExpiresAt").isNotEmpty());
    }

    @Test
    @DisplayName("Refresh: nhận cặp token mới, access mới dùng được, refresh cũ hết hiệu lực")
    void refreshRotates() throws Exception {
        Tokens first = tokens(login(email, PASSWORD));
        Tokens second = tokens(refresh(first.refresh()).andExpect(status().isOk()));

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + second.access()))
                .andExpect(status().isOk());
        assertNotSame(first.refresh(), second.refresh());
    }

    @Test
    @DisplayName("Dùng lại refresh token đã xoay: 401 REFRESH_TOKEN_REUSED và cả chuỗi bị thu hồi")
    void reuseRevokesWholeFamily() throws Exception {
        Tokens first = tokens(login(email, PASSWORD));
        Tokens second = tokens(refresh(first.refresh()).andExpect(status().isOk()));

        // someone replays the old token (e.g. a stolen copy)
        refresh(first.refresh())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REUSED"));
        // the newest token of that sign-in is revoked too
        refresh(second.refresh())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REUSED"));
    }

    @Test
    @DisplayName("Thu hồi theo chuỗi chỉ ảnh hưởng một lần đăng nhập, máy khác vẫn dùng được")
    void reuseDoesNotTouchOtherDevices() throws Exception {
        Tokens phone = tokens(login(email, PASSWORD));
        Tokens tablet = tokens(login(email, PASSWORD));
        refresh(phone.refresh()).andExpect(status().isOk());
        refresh(phone.refresh()).andExpect(status().isUnauthorized());

        refresh(tablet.refresh()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Refresh token hết hạn hoặc không tồn tại: 401 INVALID_REFRESH_TOKEN")
    void expiredOrUnknownRefresh() throws Exception {
        Tokens t = tokens(login(email, PASSWORD));
        jdbc.update("update refresh_tokens set expires_at = now() - interval '1 minute' where token_hash = ?",
                RefreshTokenService.hash(t.refresh()));

        refresh(t.refresh())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        refresh("khong-ton-tai")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    @DisplayName("Đăng xuất: 204, refresh token đó không dùng được nữa; chưa đăng nhập thì 401")
    void logout() throws Exception {
        Tokens t = tokens(login(email, PASSWORD));

        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + t.access())
                        .contentType(MediaType.APPLICATION_JSON).content(body(t.refresh())))
                .andExpect(status().isNoContent());
        refresh(t.refresh()).andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON).content(body(t.refresh())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Sửa hồ sơ: 200 với dữ liệu mới; ngày sinh ở tương lai thì 400")
    void updateProfile() throws Exception {
        Tokens t = tokens(login(email, PASSWORD));

        mvc.perform(put("/api/users/me").header("Authorization", "Bearer " + t.access())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\": \"  Nguyễn Thị Mai Anh \", \"dateOfBirth\": \"1995-03-08\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyễn Thị Mai Anh"))
                .andExpect(jsonPath("$.dateOfBirth").value("1995-03-08"));

        mvc.perform(put("/api/users/me").header("Authorization", "Bearer " + t.access())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\": \"Mai\", \"dateOfBirth\": \"2999-01-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("dateOfBirth"));
    }

    @Test
    @DisplayName("Đổi mật khẩu: sai mật khẩu cũ 400; đúng thì 204, mật khẩu cũ hết dùng, mọi phiên bị đăng xuất")
    void changePassword() throws Exception {
        Tokens t = tokens(login(email, PASSWORD));

        changePassword(t.access(), "saimatkhau1", "matkhaumoi456")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));

        changePassword(t.access(), PASSWORD, "matkhaumoi456").andExpect(status().isNoContent());

        login(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, "matkhaumoi456").andExpect(status().isOk());
        refresh(t.refresh()).andExpect(status().isUnauthorized());
    }

    private ResultActions changePassword(String access, String current, String next) throws Exception {
        return mvc.perform(put("/api/users/me/password").header("Authorization", "Bearer " + access)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\": \"%s\", \"newPassword\": \"%s\"}".formatted(current, next)));
    }

    private ResultActions login(String mail, String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\", \"password\": \"%s\"}".formatted(mail, password)));
    }

    private ResultActions refresh(String refreshToken) throws Exception {
        return mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body(refreshToken)));
    }

    private static String body(String refreshToken) {
        return "{\"refreshToken\": \"%s\"}".formatted(refreshToken);
    }

    private static Tokens tokens(ResultActions result) throws Exception {
        String json = result.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return new Tokens(JsonPath.read(json, "$.accessToken"), JsonPath.read(json, "$.refreshToken"));
    }

    private static void assertNotSame(String a, String b) {
        org.assertj.core.api.Assertions.assertThat(a).isNotEqualTo(b);
    }

    private record Tokens(String access, String refresh) {
    }
}

package com.famora.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.famora.support.FakeGoogleConfig;
import com.famora.support.IntegrationTest;
import com.famora.support.TestApi;

/** "Tiếp tục với Google", with a stand-in for Google (FakeGoogleConfig). */
class GoogleSignInTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    @DisplayName("Lần đầu với Google: tạo tài khoản không mật khẩu; lần sau vào đúng tài khoản đó")
    void firstTimeCreatesThenSignsIn() throws Exception {
        String sub = UUID.randomUUID().toString();
        String email = unique() + "@gmail.example";
        String token = TestApi.read(google(FakeGoogleConfig.token(sub, email.toUpperCase(), true, "Trần Thị Mai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty()), "$.accessToken");

        Number id = TestApi.read(new TestApi(mvc).get(token, "/api/users/me")
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Trần Thị Mai"))
                .andExpect(jsonPath("$.hasPassword").value(false)), "$.id");

        String again = TestApi.read(google(FakeGoogleConfig.token(sub, email, true, "Mai")).andExpect(status().isOk()),
                "$.accessToken");
        new TestApi(mvc).get(again, "/api/users/me").andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.fullName").value("Trần Thị Mai"));
        assertThat(jdbc.queryForObject("select count(*) from user_identities where provider_user_id = ?",
                Integer.class, sub)).isEqualTo(1);
    }

    @Test
    @DisplayName("Email Google trùng tài khoản đã đăng ký và đã xác minh: gộp vào tài khoản đó, mật khẩu vẫn dùng được")
    void verifiedEmailLinksExistingAccount() throws Exception {
        String email = unique() + "@famora.example";
        Number id = TestApi.read(json("/api/auth/register", """
                {"email": "%s", "password": "matkhau123", "fullName": "Nguyễn Văn Hùng"}
                """.formatted(email)).andExpect(status().isCreated()), "$.id");

        String token = TestApi.read(google(FakeGoogleConfig.token(UUID.randomUUID().toString(), email, true, "Hùng"))
                .andExpect(status().isOk()), "$.accessToken");
        new TestApi(mvc).get(token, "/api/users/me").andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn Hùng"))
                .andExpect(jsonPath("$.hasPassword").value(true));
        json("/api/auth/login", "{\"email\": \"%s\", \"password\": \"matkhau123\"}".formatted(email))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Email chưa xác minh: không tạo, không gộp gì cả")
    void unverifiedEmailIsRefused() throws Exception {
        String email = unique() + "@gmail.example";
        google(FakeGoogleConfig.token(UUID.randomUUID().toString(), email, false, "X"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("GOOGLE_EMAIL_UNVERIFIED"));
        assertThat(jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, email)).isZero();
    }

    @Test
    @DisplayName("Token không phải của Google cho Famora: 401")
    void forgedTokenIsRefused() throws Exception {
        google("eyJhbGciOiJub25lIn0.e30.").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_GOOGLE_TOKEN"));
        json("/api/auth/google", "{}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Tài khoản chỉ có Google: đăng nhập bằng mật khẩu bị từ chối như sai mật khẩu; đổi mật khẩu báo chưa có")
    void googleOnlyAccountHasNoPassword() throws Exception {
        String email = unique() + "@gmail.example";
        String token = TestApi.read(google(FakeGoogleConfig.token(UUID.randomUUID().toString(), email, true, ""))
                .andExpect(status().isOk()), "$.accessToken");
        new TestApi(mvc).get(token, "/api/users/me").andExpect(jsonPath("$.fullName").value(email.split("@")[0]));

        json("/api/auth/login", "{\"email\": \"%s\", \"password\": \"bat-ky-gi\"}".formatted(email))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        new TestApi(mvc).put(token, "/api/users/me/password",
                "{\"currentPassword\": \"x\", \"newPassword\": \"matkhaumoi123\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_NOT_SET"));
    }

    private ResultActions google(String idToken) throws Exception {
        return json("/api/auth/google", "{\"idToken\": \"%s\"}".formatted(idToken));
    }

    private ResultActions json(String url, String body) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static String unique() {
        return "g" + UUID.randomUUID().toString().substring(0, 10);
    }
}

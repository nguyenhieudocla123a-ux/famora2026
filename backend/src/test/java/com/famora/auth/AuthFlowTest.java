package com.famora.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.famora.support.IntegrationTest;
import com.famora.user.UserRepository;
import com.jayway.jsonpath.JsonPath;

class AuthFlowTest extends IntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Test
    @DisplayName("Đăng ký: 201, email lưu chữ thường, không trả mật khẩu")
    void registerCreatesUser() throws Exception {
        String email = uniqueEmail().toUpperCase();
        register(email, PASSWORD, "Nguyễn Văn Hiếu")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email.toLowerCase()))
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn Hiếu"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        assertThat(users.findByEmail(email.toLowerCase())).isPresent();
    }

    @Test
    @DisplayName("Đăng ký trùng email (khác hoa thường): 409 EMAIL_TAKEN")
    void duplicateEmailIsConflict() throws Exception {
        String email = uniqueEmail();
        register(email, PASSWORD, "A").andExpect(status().isCreated());
        register("  " + email.toUpperCase() + " ", PASSWORD, "B")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    @DisplayName("Dữ liệu sai: 400 VALIDATION_ERROR kèm lỗi từng trường")
    void invalidBodyIsValidationError() throws Exception {
        register("khong-phai-email", "ngan", "")
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.instance").value("/api/auth/register"))
                .andExpect(jsonPath("$.errors[?(@.field == 'email')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'password')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'fullName')]").exists());
    }

    @Test
    @DisplayName("JSON hỏng: 400 MALFORMED_REQUEST")
    void malformedJson() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    @DisplayName("Đăng nhập đúng: nhận token, dùng token xem được /api/users/me")
    void loginThenMe() throws Exception {
        String email = uniqueEmail();
        register(email, PASSWORD, "Trần Thị Lan").andExpect(status().isCreated());

        String token = loginToken(email, PASSWORD);

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Trần Thị Lan"));
    }

    @Test
    @DisplayName("Sai mật khẩu và email không tồn tại: cùng 401 INVALID_CREDENTIALS")
    void wrongCredentialsLookTheSame() throws Exception {
        String email = uniqueEmail();
        register(email, PASSWORD, "A").andExpect(status().isCreated());

        login(email, "saimatkhau9")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        login(uniqueEmail(), PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("Không có token: 401 UNAUTHORIZED")
    void noTokenIs401() throws Exception {
        mvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Token giả hoặc bị sửa: 401 INVALID_TOKEN")
    void tamperedTokenIs401() throws Exception {
        String email = uniqueEmail();
        register(email, PASSWORD, "A").andExpect(status().isCreated());
        String token = loginToken(email, PASSWORD);
        String tampered = token.substring(0, token.length() - 4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_TOKEN"));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer khong.phai.jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_TOKEN"));
    }

    @Test
    @DisplayName("Đã đăng nhập nhưng thiếu quyền: 403 FORBIDDEN")
    void missingRightIs403() throws Exception {
        String email = uniqueEmail();
        register(email, PASSWORD, "A").andExpect(status().isCreated());
        String token = loginToken(email, PASSWORD);

        mvc.perform(get("/api/test/admin-only").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private ResultActions register(String email, String password, String fullName) throws Exception {
        String body = """
                {"email": "%s", "password": "%s", "fullName": "%s"}
                """.formatted(email, password, fullName);
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions login(String email, String password) throws Exception {
        String body = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, password);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String loginToken(String email, String password) throws Exception {
        String json = login(email, password)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.accessToken");
    }

    private static String uniqueEmail() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@famora.example";
    }
}

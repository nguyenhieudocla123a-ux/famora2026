package com.famora.auth.google;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;

/** The claim checks a real Google ID token must pass (the signature is Nimbus's job). */
class GoogleTokenValidatorTest {

    static final String WEB_CLIENT = "123-web.apps.googleusercontent.com";
    final OAuth2TokenValidator<Jwt> validator = NimbusGoogleTokenVerifier.validator(WEB_CLIENT);

    @Test
    @DisplayName("Đúng nơi cấp, đúng app, còn hạn: hợp lệ (cả hai dạng iss Google dùng)")
    void validToken() {
        assertThat(validator.validate(jwt("accounts.google.com", WEB_CLIENT, 3600)).hasErrors()).isFalse();
        assertThat(validator.validate(jwt("https://accounts.google.com", WEB_CLIENT, 3600)).hasErrors()).isFalse();
    }

    @Test
    @DisplayName("Token Google cấp cho app khác, hoặc không do Google cấp, hoặc hết hạn: bị từ chối")
    void wrongAudienceIssuerOrExpired() {
        assertThat(validator.validate(jwt("accounts.google.com", "other-app", 3600)).hasErrors()).isTrue();
        assertThat(validator.validate(jwt("https://evil.example", WEB_CLIENT, 3600)).hasErrors()).isTrue();
        assertThat(validator.validate(jwt("accounts.google.com", WEB_CLIENT, -3600)).hasErrors()).isTrue();
    }

    @Test
    @DisplayName("Chưa cấu hình web client ID: không token nào qua được")
    void noAudienceConfigured() {
        assertThat(NimbusGoogleTokenVerifier.validator(null).validate(jwt("accounts.google.com", WEB_CLIENT, 3600))
                .hasErrors()).isTrue();
    }

    private static Jwt jwt(String iss, String aud, long expiresInSeconds) {
        Instant now = Instant.now();
        return Jwt.withTokenValue("t").header("alg", "RS256")
                .claim("iss", iss).audience(List.of(aud)).subject("1234")
                .issuedAt(now.minusSeconds(Math.abs(expiresInSeconds) + 60))
                .expiresAt(now.plusSeconds(expiresInSeconds))
                .build();
    }
}

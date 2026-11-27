package com.famora.common.security;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * famora.jwt.* settings.
 *
 * @param secret    base64 of at least 32 random bytes (HMAC-SHA256); read from JWT_SECRET, never committed
 * @param issuer    the "iss" claim written and required on every token
 * @param accessTtl how long an access token lives (15 minutes by design)
 */
@Validated
@ConfigurationProperties(prefix = "famora.jwt")
public record JwtProperties(@NotBlank String secret, @NotBlank String issuer, @NotNull Duration accessTtl) {
}

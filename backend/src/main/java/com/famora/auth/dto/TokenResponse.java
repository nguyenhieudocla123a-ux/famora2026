package com.famora.auth.dto;

import java.time.Instant;

/** Phase 3 returns the access token only; the refresh token arrives in Phase 4. */
public record TokenResponse(String accessToken, String tokenType, Instant expiresAt) {

    public static TokenResponse bearer(String token, Instant expiresAt) {
        return new TokenResponse(token, "Bearer", expiresAt);
    }
}

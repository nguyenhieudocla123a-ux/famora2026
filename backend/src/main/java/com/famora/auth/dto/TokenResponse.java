package com.famora.auth.dto;

import java.time.Instant;

/**
 * The pair returned by sign-in and refresh. The access token goes in "Authorization: Bearer"; the refresh
 * token is kept in the phone's secure storage and only ever sent to /api/auth/refresh and /api/auth/logout.
 */
public record TokenResponse(String accessToken, String tokenType, Instant expiresAt, String refreshToken,
        Instant refreshExpiresAt) {

    public static TokenResponse bearer(String access, Instant accessExpiresAt, String refresh,
            Instant refreshExpiresAt) {
        return new TokenResponse(access, "Bearer", accessExpiresAt, refresh, refreshExpiresAt);
    }
}

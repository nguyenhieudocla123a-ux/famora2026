package com.famora.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body of /api/auth/refresh and /api/auth/logout. */
public record RefreshRequest(
        @NotBlank(message = "Thiếu refresh token")
        @Size(max = 200, message = "Refresh token không hợp lệ")
        String refreshToken) {
}

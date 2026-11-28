package com.famora.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The ID token the Google Sign-In SDK gave the app. */
public record GoogleLoginRequest(
        @NotBlank(message = "Thiếu mã xác thực Google") @Size(max = 4096, message = "Mã xác thực Google quá dài") String idToken) {
}

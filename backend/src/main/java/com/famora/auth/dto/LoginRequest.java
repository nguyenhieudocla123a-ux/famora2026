package com.famora.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Nhập email") String email,
        @NotBlank(message = "Nhập mật khẩu") String password) {

    public LoginRequest {
        email = email == null ? null : email.strip();
    }
}

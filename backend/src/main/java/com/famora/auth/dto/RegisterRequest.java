package com.famora.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Nhập email")
        @Email(message = "Email chưa đúng định dạng")
        @Size(max = 254, message = "Email quá dài")
        String email,

        @NotBlank(message = "Nhập mật khẩu")
        @Size(min = 8, max = 72, message = "Mật khẩu từ 8 đến 72 ký tự")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mật khẩu cần có cả chữ và số")
        String password,

        @NotBlank(message = "Nhập họ tên")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName) {

    /** Spaces around a pasted email are not the user's intent: trim before validating. */
    public RegisterRequest {
        email = email == null ? null : email.strip();
    }
}

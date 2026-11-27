package com.famora.user;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Nhập họ tên")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @Past(message = "Ngày sinh phải ở trong quá khứ")
        LocalDate dateOfBirth) {
}

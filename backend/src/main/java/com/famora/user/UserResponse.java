package com.famora.user;

import java.time.Instant;
import java.time.LocalDate;

/**
 * What the API shows about an account; never the password hash. {@code hasPassword} is false for an account
 * that only signs in with Google (the app then hides "Đổi mật khẩu").
 */
public record UserResponse(Long id, String email, String fullName, LocalDate dateOfBirth, String avatarUrl,
        Instant createdAt, boolean hasPassword) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getDateOfBirth(), u.getAvatarUrl(),
                u.getCreatedAt(), u.hasPassword());
    }
}

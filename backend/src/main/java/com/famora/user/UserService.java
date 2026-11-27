package com.famora.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.auth.AuthService;
import com.famora.auth.RefreshTokenService;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

@Service
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final RefreshTokenService refreshTokens;

    public UserService(UserRepository users, PasswordEncoder passwords, RefreshTokenService refreshTokens) {
        this.users = users;
        this.passwords = passwords;
        this.refreshTokens = refreshTokens;
    }

    @Transactional(readOnly = true)
    public UserResponse me(long userId) {
        return UserResponse.from(activeUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(long userId, UpdateProfileRequest req) {
        User user = activeUser(userId);
        user.updateProfile(req.fullName().trim(), req.dateOfBirth());
        return UserResponse.from(user);
    }

    /** Needs the current password; afterwards every device must sign in again. */
    @Transactional
    public void changePassword(long userId, ChangePasswordRequest req) {
        User user = activeUser(userId);
        if (!passwords.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.WRONG_PASSWORD);
        }
        if (AuthService.tooLongForBcrypt(req.newPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_TOO_LONG);
        }
        user.changePasswordHash(passwords.encode(req.newPassword()));
        refreshTokens.revokeAll(userId);
    }

    /** A token for a deleted or locked account is treated as no longer valid. */
    private User activeUser(long userId) {
        return users.findById(userId)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));
    }
}

package com.famora.auth;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.auth.dto.LoginRequest;
import com.famora.auth.dto.RegisterRequest;
import com.famora.auth.dto.TokenResponse;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.common.security.TokenService;
import com.famora.user.User;
import com.famora.user.UserRepository;
import com.famora.user.UserResponse;
import com.famora.user.UserStatus;

@Service
public class AuthService {

    /** BCrypt only reads the first 72 bytes; Vietnamese letters take up to 3 bytes each. */
    public static final int BCRYPT_MAX_BYTES = 72;

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final TokenService accessTokens;
    private final RefreshTokenService refreshTokens;
    /** Compared against when the email is unknown, so a wrong email takes as long as a wrong password. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder passwords, TokenService accessTokens,
            RefreshTokenService refreshTokens) {
        this.users = users;
        this.passwords = passwords;
        this.accessTokens = accessTokens;
        this.refreshTokens = refreshTokens;
        this.dummyHash = passwords.encode("famora-timing-guard");
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (tooLongForBcrypt(req.password())) {
            throw new BusinessException(ErrorCode.PASSWORD_TOO_LONG);
        }
        String email = normalise(req.email());
        if (users.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_TAKEN);
        }
        try {
            User saved = users.saveAndFlush(new User(email, passwords.encode(req.password()), req.fullName().trim()));
            return UserResponse.from(saved);
        } catch (DataIntegrityViolationException raced) {
            // two sign-ups with the same email at the same moment: the unique index decides
            throw new BusinessException(ErrorCode.EMAIL_TAKEN);
        }
    }

    /** One answer for "no such email" and "wrong password", so the API never tells which emails exist. */
    @Transactional
    public TokenResponse login(LoginRequest req) {
        if (tooLongForBcrypt(req.password())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        User user = users.findByEmail(normalise(req.email())).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash;
        boolean matches = passwords.matches(req.password(), hash);
        if (user == null || !matches || user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        return pair(user, refreshTokens.issue(user.getId()));
    }

    /** New access + refresh pair for a valid refresh token; the old refresh token stops working. */
    @Transactional(noRollbackFor = BusinessException.class)
    public TokenResponse refresh(String refreshToken) {
        RefreshTokenService.Rotated rotated = refreshTokens.rotate(refreshToken);
        User user = users.findById(rotated.userId())
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        return pair(user, rotated.token());
    }

    /** Ends this device's session. The access token still works until it expires (at most 15 minutes). */
    public void logout(long userId, String refreshToken) {
        refreshTokens.revoke(refreshToken, userId);
    }

    private TokenResponse pair(User user, RefreshTokenService.Issued refresh) {
        TokenService.IssuedToken access = accessTokens.issueAccessToken(user.getId(), user.getEmail());
        return TokenResponse.bearer(access.value(), access.expiresAt(), refresh.value(), refresh.expiresAt());
    }

    public static boolean tooLongForBcrypt(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES;
    }

    static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

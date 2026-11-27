package com.famora.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.common.security.JwtProperties;

/**
 * Opaque refresh tokens with rotation and reuse detection.
 * <ul>
 * <li>The client gets 32 random bytes; the database keeps only their SHA-256.</li>
 * <li>Each refresh revokes the token it used and issues the next one in the same family.</li>
 * <li>A revoked token showing up again means someone kept a copy: the whole family is revoked and both
 * the thief and the real user must sign in again.</li>
 * </ul>
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final int TOKEN_BYTES = 32;

    private final RefreshTokenRepository tokens;
    private final JwtProperties props;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository tokens, JwtProperties props, Clock clock) {
        this.tokens = tokens;
        this.props = props;
        this.clock = clock;
    }

    /** Starts a new family: called on sign-in. */
    @Transactional
    public Issued issue(long userId) {
        return issueInFamily(userId, UUID.randomUUID()).issued();
    }

    /**
     * Trades a refresh token for the next one. Not rolled back on BusinessException: when reuse is detected
     * the family revocation must be saved even though the call fails.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public Rotated rotate(String rawToken) {
        Instant now = Instant.now(clock);
        RefreshToken current = tokens.findForUpdate(hash(rawToken))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        if (current.isRevoked()) {
            int revoked = tokens.revokeFamily(current.getTokenFamily(), now);
            log.warn("Refresh token reuse for user {}: revoked {} token(s) of family {}",
                    current.getUserId(), revoked, current.getTokenFamily());
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED);
        }
        if (current.isExpired(now)) {
            current.revoke(now);
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        Stored next = issueInFamily(current.getUserId(), current.getTokenFamily());
        current.replaceWith(next.entity(), now);
        return new Rotated(current.getUserId(), next.issued());
    }

    /** Sign-out: revokes this token only if it belongs to the caller; unknown tokens are ignored. */
    @Transactional
    public void revoke(String rawToken, long userId) {
        tokens.findForUpdate(hash(rawToken))
                .filter(t -> t.getUserId() == userId)
                .ifPresent(t -> t.revoke(Instant.now(clock)));
    }

    /** Signs the user out everywhere, e.g. after a password change. */
    @Transactional
    public void revokeAll(long userId) {
        tokens.revokeAllOfUser(userId, Instant.now(clock));
    }

    private Stored issueInFamily(long userId, UUID family) {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(props.refreshTtl());
        RefreshToken saved = tokens.saveAndFlush(new RefreshToken(userId, hash(raw), family, now, expiresAt));
        return new Stored(saved, new Issued(raw, expiresAt));
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    public record Issued(String value, Instant expiresAt) {
    }

    public record Rotated(long userId, Issued token) {
    }

    private record Stored(RefreshToken entity, Issued issued) {
    }
}

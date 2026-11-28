package com.famora.auth.google;

import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.auth.AuthService;
import com.famora.auth.dto.TokenResponse;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.user.User;
import com.famora.user.UserRepository;
import com.famora.user.UserStatus;

/**
 * "Tiếp tục với Google": the app sends the ID token from the Google SDK; nothing the app says about the
 * person is trusted, only what the checked token says. Then the usual Famora token pair is issued.
 * <ol>
 * <li>This Google account was seen before: sign in to the account it is linked to.</li>
 * <li>New Google account, email verified by Google, and a Famora account with that email exists: link the
 * two and sign in (decided with the user: Google has proved the person owns the address).</li>
 * <li>Otherwise: a new Famora account without a password, linked to this Google account.</li>
 * </ol>
 * An unverified email never creates or links anything.
 */
@Service
public class GoogleAuthService {

    private static final int MAX_NAME = 100;

    private final GoogleTokenVerifier verifier;
    private final UserIdentityRepository identities;
    private final UserRepository users;
    private final AuthService auth;

    public GoogleAuthService(GoogleTokenVerifier verifier, UserIdentityRepository identities, UserRepository users,
            AuthService auth) {
        this.verifier = verifier;
        this.identities = identities;
        this.users = users;
        this.auth = auth;
    }

    @Transactional
    public TokenResponse signIn(String idToken) {
        GoogleIdentity google = verifier.verify(idToken);
        User user = identities.findByProviderAndProviderUserId(UserIdentity.GOOGLE, google.subject())
                .flatMap(link -> users.findById(link.getUserId()))
                .orElseGet(() -> linkOrCreate(google));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);
        }
        return auth.issueTokens(user);
    }

    private User linkOrCreate(GoogleIdentity google) {
        if (google.email() == null || !google.emailVerified()) {
            throw new BusinessException(ErrorCode.GOOGLE_EMAIL_UNVERIFIED);
        }
        String email = google.email().trim().toLowerCase(Locale.ROOT);
        User user = users.findByEmail(email)
                .orElseGet(() -> users.saveAndFlush(new User(email, null, displayName(google, email))));
        identities.save(new UserIdentity(user.getId(), UserIdentity.GOOGLE, google.subject(), email));
        return user;
    }

    /**
     * The name in Vietnamese order: family name then given name ("Nguyễn Văn" + "Hiếu" = "Nguyễn Văn Hiếu"), as
     * the app greets people by the last word. Without both parts: Google's full name, else the part of the
     * email before "@". Never longer than the column.
     */
    static String displayName(GoogleIdentity google, String email) {
        String n;
        if (notBlank(google.familyName()) && notBlank(google.givenName())) {
            n = google.familyName().trim() + " " + google.givenName().trim();
        } else if (notBlank(google.name())) {
            n = google.name().trim();
        } else {
            n = email.substring(0, email.indexOf('@'));
        }
        return n.length() > MAX_NAME ? n.substring(0, MAX_NAME) : n;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}

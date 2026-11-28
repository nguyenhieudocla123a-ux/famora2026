package com.famora.auth.google;

import java.util.List;
import java.util.Set;

import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

/**
 * Checks Google ID tokens the standard way (no call to Google per sign-in, only for its public keys):
 * <ul>
 * <li>signature: RS256 with one of Google's published keys (fetched from the JWKS URL and cached);</li>
 * <li>exp / nbf: still valid (a minute of clock skew allowed);</li>
 * <li>iss: accounts.google.com;</li>
 * <li>aud: Famora's web client ID, so a token Google made for another app is refused.</li>
 * </ul>
 */
@Component
public class NimbusGoogleTokenVerifier implements GoogleTokenVerifier {

    static final String JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final GoogleProperties props;
    private final NimbusJwtDecoder decoder;

    public NimbusGoogleTokenVerifier(GoogleProperties props) {
        this.props = props;
        this.decoder = NimbusJwtDecoder.withJwkSetUri(JWKS_URI).build();
        this.decoder.setJwtValidator(validator(props.webClientId()));
    }

    static OAuth2TokenValidator<Jwt> validator(String audience) {
        OAuth2TokenValidator<Jwt> issuer = jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "wrong issuer", null));
        OAuth2TokenValidator<Jwt> aud = jwt -> {
            List<String> auds = jwt.getAudience();
            return audience != null && auds != null && auds.contains(audience)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "wrong audience", null));
        };
        return new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), issuer, aud);
    }

    @Override
    public GoogleIdentity verify(String idToken) {
        if (!props.enabled()) {
            throw new BusinessException(ErrorCode.GOOGLE_SIGN_IN_UNAVAILABLE);
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            throw new BusinessException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        return new GoogleIdentity(jwt.getSubject(), jwt.getClaimAsString("email"),
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")), jwt.getClaimAsString("name"),
                jwt.getClaimAsString("given_name"), jwt.getClaimAsString("family_name"));
    }
}

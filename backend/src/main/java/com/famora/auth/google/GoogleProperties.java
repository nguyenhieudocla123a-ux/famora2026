package com.famora.auth.google;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * famora.google.* settings.
 *
 * @param webClientId the OAuth "Web application" client ID (GOOGLE_WEB_CLIENT_ID). Google writes it into the
 *                    "aud" of every ID token the app gets, so it is the one value a token must be issued for.
 *                    Not a secret, but kept in .env with the other settings. Blank turns Google sign-in off.
 */
@ConfigurationProperties(prefix = "famora.google")
public record GoogleProperties(String webClientId) {

    public boolean enabled() {
        return webClientId != null && !webClientId.isBlank();
    }
}

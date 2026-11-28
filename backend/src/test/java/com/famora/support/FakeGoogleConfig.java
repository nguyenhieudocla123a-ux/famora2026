package com.famora.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import com.famora.auth.google.GoogleIdentity;
import com.famora.auth.google.GoogleTokenVerifier;
import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

/**
 * Stands in for Google in tests, so no test ever calls Google. A "token" is readable text:
 * {@code fake-google|sub|email|verified|name}; anything else is refused like a forged token.
 */
@TestConfiguration(proxyBeanMethods = false)
public class FakeGoogleConfig {

    public static String token(String sub, String email, boolean verified, String name) {
        return String.join("|", "fake-google", sub, email, Boolean.toString(verified), name);
    }

    @Bean
    @Primary
    GoogleTokenVerifier fakeGoogle() {
        return idToken -> {
            String[] p = idToken.split("\\|", -1);
            if (p.length != 5 || !p[0].equals("fake-google")) {
                throw new BusinessException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }
            return new GoogleIdentity(p[1], p[2].isEmpty() ? null : p[2], Boolean.parseBoolean(p[3]),
                    p[4].isEmpty() ? null : p[4]);
        };
    }
}

package com.famora.auth.google;

/**
 * What a checked Google ID token says about its owner. Only these fields are ever trusted.
 * {@code name} is in Western order ("Hiếu Nguyễn Văn"); {@code givenName} / {@code familyName} are the parts.
 */
public record GoogleIdentity(String subject, String email, boolean emailVerified, String name, String givenName,
        String familyName) {

    public GoogleIdentity(String subject, String email, boolean emailVerified, String name) {
        this(subject, email, emailVerified, name, null, null);
    }
}

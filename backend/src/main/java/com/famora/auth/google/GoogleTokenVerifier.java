package com.famora.auth.google;

/**
 * Checks a Google ID token and says whose it is. An interface so tests can stand in for Google.
 * Throws BusinessException(INVALID_GOOGLE_TOKEN) for anything not issued by Google for Famora.
 */
public interface GoogleTokenVerifier {

    GoogleIdentity verify(String idToken);
}

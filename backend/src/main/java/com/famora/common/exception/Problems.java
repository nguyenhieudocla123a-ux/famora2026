package com.famora.common.exception;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;

import org.springframework.http.ProblemDetail;

/** Builds the app's one error shape: RFC 7807 plus "code" and "timestamp". */
public final class Problems {

    private static final String TYPE_BASE = "https://famora.app/errors/";

    private Problems() {
    }

    public static ProblemDetail of(ErrorCode code, String instance, Clock clock) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(code.status(), code.message());
        p.setType(URI.create(TYPE_BASE + code.name().toLowerCase(Locale.ROOT).replace('_', '-')));
        p.setTitle(code.status().getReasonPhrase());
        if (instance != null) {
            p.setInstance(URI.create(instance));
        }
        p.setProperty("code", code.name());
        p.setProperty("timestamp", Instant.now(clock).toString());
        return p;
    }
}

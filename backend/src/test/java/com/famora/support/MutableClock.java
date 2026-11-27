package com.famora.support;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * A clock tests can stop and move. Unset, it is the real clock, so the rest of the suite is unaffected.
 * Always {@link #reset()} after moving it (the Spring context, and this clock, are shared by all tests).
 */
public class MutableClock extends Clock {

    private volatile Instant fixed;
    private final ZoneId zone;

    public MutableClock() {
        this(null, ZoneOffset.UTC);
    }

    private MutableClock(Instant fixed, ZoneId zone) {
        this.fixed = fixed;
        this.zone = zone;
    }

    public void set(Instant instant) {
        this.fixed = instant;
    }

    public void reset() {
        this.fixed = null;
    }

    @Override
    public Instant instant() {
        Instant f = fixed;
        return f != null ? f : Instant.now();
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    /** Same time source, other zone: moving this clock moves the zoned view too. */
    @Override
    public Clock withZone(ZoneId zone) {
        MutableClock parent = this;
        return new Clock() {
            @Override
            public Instant instant() {
                return parent.instant();
            }

            @Override
            public ZoneId getZone() {
                return zone;
            }

            @Override
            public Clock withZone(ZoneId other) {
                return parent.withZone(other);
            }
        };
    }
}

package com.famora.common.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * One clock for the whole app. Instants are stored in UTC; "today" is always computed in Vietnam time.
 * Tests replace this bean with a fixed clock.
 */
@Configuration
public class ClockConfig {

    public static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}

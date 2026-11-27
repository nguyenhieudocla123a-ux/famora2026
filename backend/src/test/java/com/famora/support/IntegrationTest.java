package com.famora.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base for tests that need the whole app: a real PostgreSQL 17 in Docker (same engine as production,
 * so Flyway migrations and constraints are tested for real).
 * <p>
 * The container is started once for the whole test run and never stopped by JUnit ("singleton container"):
 * Spring caches one application context for all test classes, and that context must keep talking to the
 * same database. Testcontainers removes it when the JVM exits.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestClockConfig.class)
public abstract class IntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    static {
        POSTGRES.start();
    }
}

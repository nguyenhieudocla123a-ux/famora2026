package com.famora.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Like IntegrationTest, but on a real HTTP port: for clients that open real connections (WebSocket). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestClockConfig.class)
public abstract class RealServerTest {

    /** The same single container as IntegrationTest. */
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = IntegrationTest.POSTGRES;

    @LocalServerPort
    protected int port;
}

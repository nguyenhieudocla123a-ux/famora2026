package com.famora.common.security;

import java.io.IOException;
import java.time.Clock;

import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.famora.common.exception.ErrorCode;
import com.famora.common.exception.Problems;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/** 401 and 403 raised by the security filters, written in the same ProblemDetail shape as the controllers. */
@Component
public class ProblemSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final JsonMapper json;
    private final Clock clock;

    public ProblemSecurityHandlers(JsonMapper json, Clock clock) {
        this.json = json;
        this.clock = clock;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        ErrorCode code = ex instanceof InvalidBearerTokenException ? ErrorCode.INVALID_TOKEN : ErrorCode.UNAUTHORIZED;
        response.setHeader("WWW-Authenticate", "Bearer");
        write(response, Problems.of(code, request.getRequestURI(), clock));
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        write(response, Problems.of(ErrorCode.FORBIDDEN, request.getRequestURI(), clock));
    }

    private void write(HttpServletResponse response, ProblemDetail problem) throws IOException {
        response.setStatus(problem.getStatus());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        json.writeValue(response.getOutputStream(), problem);
    }
}

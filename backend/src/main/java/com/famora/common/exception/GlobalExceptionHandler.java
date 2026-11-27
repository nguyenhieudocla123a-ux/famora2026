package com.famora.common.exception;

import java.time.Clock;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

/** Every error leaves the API as a ProblemDetail with a business code; stack traces stay in the log. */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final Clock clock;

    public GlobalExceptionHandler(Clock clock) {
        this.clock = clock;
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex, HttpServletRequest request) {
        return respond(ex.code(), request.getRequestURI());
    }

    /** @PreAuthorize failures inside controllers: the user is signed in but lacks the right. */
    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<ProblemDetail> handleDenied(RuntimeException ex, HttpServletRequest request) {
        return respond(ErrorCode.FORBIDDEN, request.getRequestURI());
    }

    /** Two saves of the same row at the same moment: JPA's @Version caught it. */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> handleOptimisticLock(RuntimeException ex, HttpServletRequest request) {
        return respond(ErrorCode.VERSION_CONFLICT, request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {}", request.getRequestURI(), ex);
        return respond(ErrorCode.INTERNAL_ERROR, request.getRequestURI());
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail p = Problems.of(ErrorCode.VALIDATION_ERROR, path(request), clock);
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message", String.valueOf(e.getDefaultMessage())))
                .toList();
        p.setProperty("errors", errors);
        return ResponseEntity.status(p.getStatus()).body(p);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail p = Problems.of(ErrorCode.MALFORMED_REQUEST, path(request), clock);
        return ResponseEntity.status(p.getStatus()).body(p);
    }

    /**
     * Every other framework error (missing parameter, wrong type, wrong method...) keeps Spring's status and
     * gets the same "code" and "timestamp" fields as ours, so the app parses one shape everywhere.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        if (body instanceof ProblemDetail p && (p.getProperties() == null || !p.getProperties().containsKey("code"))) {
            HttpStatus resolved = HttpStatus.resolve(status.value());
            p.setProperty("code", status.value() == 400 ? ErrorCode.MALFORMED_REQUEST.name()
                    : resolved != null ? resolved.name() : "ERROR");
            p.setProperty("timestamp", java.time.Instant.now(clock).toString());
        }
        return super.handleExceptionInternal(ex, body, headers, status, request);
    }

    private ResponseEntity<ProblemDetail> respond(ErrorCode code, String path) {
        return ResponseEntity.status(code.status()).body(Problems.of(code, path, clock));
    }

    private static String path(WebRequest request) {
        return request instanceof ServletWebRequest s ? s.getRequest().getRequestURI() : null;
    }
}

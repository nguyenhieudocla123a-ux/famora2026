package com.famora.common.exception;

/** A rule of the domain was broken; the handler turns it into a ProblemDetail with its code. */
public class BusinessException extends RuntimeException {

    private final ErrorCode code;

    public BusinessException(ErrorCode code) {
        super(code.message());
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}

package com.famora.common.exception;

import org.springframework.http.HttpStatus;

/** Business error codes returned in the "code" field of every error response. */
public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    PASSWORD_TOO_LONG(HttpStatus.BAD_REQUEST, "Mật khẩu quá dài, hãy dùng mật khẩu ngắn hơn"),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "Nội dung yêu cầu không đọc được"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy"),
    EMAIL_TAKEN(HttpStatus.CONFLICT, "Email này đã được đăng ký"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra, vui lòng thử lại sau");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }
}

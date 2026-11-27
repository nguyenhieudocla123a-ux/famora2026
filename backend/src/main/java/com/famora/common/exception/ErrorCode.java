package com.famora.common.exception;

import org.springframework.http.HttpStatus;

/** Business error codes returned in the "code" field of every error response. */
public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    PASSWORD_TOO_LONG(HttpStatus.BAD_REQUEST, "Mật khẩu quá dài, hãy dùng mật khẩu ngắn hơn"),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "Nội dung yêu cầu không đọc được"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã bị thu hồi vì lý do an toàn, vui lòng đăng nhập lại"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"),
    WRONG_PASSWORD(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy"),
    FAMILY_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy gia đình"),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy thành viên này trong gia đình"),
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy mã mời"),
    INVITATION_INVALID(HttpStatus.NOT_FOUND, "Mã mời không đúng, đã hết hạn hoặc đã hết lượt dùng"),
    ALREADY_MEMBER(HttpStatus.CONFLICT, "Bạn đã là thành viên của gia đình này"),
    OWNER_MUST_TRANSFER(HttpStatus.CONFLICT, "Chủ nhà cần chuyển quyền cho người khác trước khi rời gia đình"),
    OWNER_IS_PROTECTED(HttpStatus.CONFLICT, "Không thể đổi vai trò hoặc xoá chủ nhà"),
    NOT_ON_YOURSELF(HttpStatus.CONFLICT, "Không thể thực hiện thao tác này với chính bạn"),
    INVALID_LUNAR_DATE(HttpStatus.BAD_REQUEST, "Ngày âm lịch này không tồn tại"),
    DATE_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ các năm từ 1901 đến 2099"),
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

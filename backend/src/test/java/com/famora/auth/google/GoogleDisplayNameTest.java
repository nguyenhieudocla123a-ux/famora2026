package com.famora.auth.google;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GoogleDisplayNameTest {

    @Test
    @DisplayName("Có họ và tên riêng: ghép theo kiểu Việt, họ trước tên sau")
    void vietnameseOrder() {
        GoogleIdentity g = new GoogleIdentity("1", "a@gmail.com", true, "Hiếu Nguyễn Văn", "Hiếu", "Nguyễn Văn");
        assertThat(GoogleAuthService.displayName(g, "a@gmail.com")).isEqualTo("Nguyễn Văn Hiếu");
    }

    @Test
    @DisplayName("Thiếu họ hoặc tên: dùng tên đầy đủ của Google, không có nữa thì lấy phần trước @ của email")
    void fallbacks() {
        assertThat(GoogleAuthService.displayName(new GoogleIdentity("1", "a@gmail.com", true, "Mai", "Mai", null),
                "a@gmail.com")).isEqualTo("Mai");
        assertThat(GoogleAuthService.displayName(new GoogleIdentity("1", "tran.mai@gmail.com", true, " "),
                "tran.mai@gmail.com")).isEqualTo("tran.mai");
    }
}

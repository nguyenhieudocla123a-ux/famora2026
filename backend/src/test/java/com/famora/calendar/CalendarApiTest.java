package com.famora.calendar;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import com.famora.support.IntegrationTest;
import com.famora.support.TestApi;

class CalendarApiTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    TestApi api;
    String token;

    @BeforeEach
    void signIn() throws Exception {
        api = new TestApi(mvc);
        token = api.newUser("Người Xem Lịch");
    }

    @Test
    @DisplayName("Dương → âm: 27/11/2026 là 19/10 âm, ngày Ất Tỵ, tháng Kỷ Hợi, năm Bính Ngọ")
    void solarToLunar() throws Exception {
        api.get(token, "/api/calendar/convert?date=2026-11-27").andExpect(status().isOk())
                .andExpect(jsonPath("$.weekday").value(5))
                .andExpect(jsonPath("$.lunar.day").value(19))
                .andExpect(jsonPath("$.lunar.month").value(10))
                .andExpect(jsonPath("$.lunar.year").value(2026))
                .andExpect(jsonPath("$.lunar.monthName").value("tháng Mười"))
                .andExpect(jsonPath("$.canChiDay").value("Ất Tỵ"))
                .andExpect(jsonPath("$.lunar.canChiMonth").value("Kỷ Hợi"))
                .andExpect(jsonPath("$.lunar.canChiYear").value("Bính Ngọ"));
    }

    @Test
    @DisplayName("Âm → dương: giỗ 21/10 âm năm 2026 rơi vào 29/11/2026; Tết 2027 kèm ngày lễ")
    void lunarToSolar() throws Exception {
        api.get(token, "/api/calendar/convert?lunarDay=21&lunarMonth=10&lunarYear=2026").andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2026-11-29"));
        api.get(token, "/api/calendar/convert?lunarDay=1&lunarMonth=1&lunarYear=2027").andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2027-02-06"))
                .andExpect(jsonPath("$.holidays[0].name").value("Tết Nguyên Đán"))
                .andExpect(jsonPath("$.holidays[0].publicHoliday").value(true));
    }

    @Test
    @DisplayName("Ngày âm không tồn tại: 400 INVALID_LUNAR_DATE; năm ngoài phạm vi: 400 DATE_OUT_OF_RANGE")
    void invalidLunar() throws Exception {
        api.get(token, "/api/calendar/convert?lunarDay=30&lunarMonth=12&lunarYear=2026").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_LUNAR_DATE"));
        api.get(token, "/api/calendar/convert?lunarDay=1&lunarMonth=3&lunarYear=2023&leap=true")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_LUNAR_DATE"));
        api.get(token, "/api/calendar/convert?date=2150-01-01").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("DATE_OUT_OF_RANGE"));
        api.get(token, "/api/calendar/convert?date=khong-phai-ngay").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    @DisplayName("Lịch tháng 11/2026: 42 ô bắt đầu thứ Hai 26/10, có phụ đề âm lịch")
    void monthGrid() throws Exception {
        api.get(token, "/api/calendar/month?year=2026&month=11").andExpect(status().isOk())
                .andExpect(jsonPath("$.cells.length()").value(42))
                .andExpect(jsonPath("$.cells[0].date").value("2026-10-26"))
                .andExpect(jsonPath("$.cells[0].inMonth").value(false))
                .andExpect(jsonPath("$.cells[6].date").value("2026-11-01"))
                .andExpect(jsonPath("$.cells[6].inMonth").value(true))
                .andExpect(jsonPath("$.cells[6].lunarDay").value(23))
                .andExpect(jsonPath("$.lunarSubtitle").value("Tháng Chín – tháng Mười năm Bính Ngọ"));
        api.get(token, "/api/calendar/month?year=2026&month=13").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Chưa đăng nhập: 401")
    void needsSignIn() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/calendar/month?year=2026&month=11"))
                .andExpect(status().isUnauthorized());
    }
}

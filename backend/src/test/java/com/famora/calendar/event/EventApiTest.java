package com.famora.calendar.event;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.famora.common.config.ClockConfig;
import com.famora.support.IntegrationTest;
import com.famora.support.TestApi;

class EventApiTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    TestApi api;
    String owner;
    String member;
    String outsider;
    long familyId;

    @BeforeEach
    void family() throws Exception {
        api = new TestApi(mvc);
        owner = api.newUser("Nguyễn Văn Hùng");
        member = api.newUser("Nguyễn Văn Hiếu");
        outsider = api.newUser("Người Lạ");
        familyId = ((Number) TestApi.read(api.post(owner, "/api/families", "{\"name\": \"Nhà họ Nguyễn\"}"), "$.id")).longValue();
        String code = TestApi.read(api.post(owner, base() + "/invitations", "{}"), "$.code");
        api.post(member, "/api/families/join", "{\"code\": \"%s\"}".formatted(code)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sinh nhật dương hằng năm: xuất hiện trong lịch kèm số tuổi")
    void solarBirthday() throws Exception {
        create(owner, """
                {"type": "BIRTHDAY", "title": "Sinh nhật Hiếu", "calendarType": "SOLAR",
                 "solarDate": "1998-05-14", "recurrence": "YEARLY"}
                """).andExpect(status().isCreated()).andExpect(jsonPath("$.version").value(0));
        range(owner, "2026-05-01", "2026-05-31").andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].date").value("2026-05-14"))
                .andExpect(jsonPath("$[0].anniversary").value(28));
    }

    @Test
    @DisplayName("Giỗ 21/10 âm không rõ năm: tính ra 29/11/2026, kèm ngày âm")
    void lunarDeathAnniversary() throws Exception {
        create(owner, """
                {"type": "DEATH_ANNIVERSARY", "title": "Giỗ bà nội", "calendarType": "LUNAR",
                 "lunarDay": 21, "lunarMonth": 10, "recurrence": "YEARLY", "startTime": "10:00"}
                """).andExpect(status().isCreated()).andExpect(jsonPath("$.solarDate").doesNotExist());
        range(owner, "2026-11-01", "2026-11-30").andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-11-29"))
                .andExpect(jsonPath("$[0].lunarDay").value(21))
                .andExpect(jsonPath("$[0].lunarMonth").value(10))
                .andExpect(jsonPath("$[0].startTime").value("10:00:00"))
                .andExpect(jsonPath("$[0].anniversary").doesNotExist());
    }

    @Test
    @DisplayName("Thiếu ngày hoặc ngày âm không tồn tại: 400")
    void invalidDates() throws Exception {
        create(owner, "{\"type\": \"FAMILY_EVENT\", \"title\": \"Họp mặt\", \"calendarType\": \"SOLAR\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("EVENT_DATE_REQUIRED"));
        create(owner, """
                {"type": "FAMILY_EVENT", "title": "Họp mặt", "calendarType": "LUNAR", "lunarDay": 5, "lunarMonth": 1}
                """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("EVENT_DATE_REQUIRED"));
        create(owner, """
                {"type": "FAMILY_EVENT", "title": "Họp mặt", "calendarType": "LUNAR",
                 "lunarDay": 30, "lunarMonth": 12, "lunarYear": 2026}
                """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_LUNAR_DATE"));
        create(owner, """
                {"type": "FAMILY_EVENT", "title": "", "calendarType": "SOLAR", "solarDate": "2026-12-01"}
                """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("MEMBER tạo được khi gia đình cho phép; tắt quyền thì 403")
    void memberCreateFollowsFamilySetting() throws Exception {
        create(member, once("Đi chơi", "2026-12-20")).andExpect(status().isCreated());
        api.put(owner, base(), "{\"name\": \"Nhà họ Nguyễn\", \"memberCanCreateEvents\": false}").andExpect(status().isOk());
        create(member, once("Đi chơi 2", "2026-12-21")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("MEMBER sửa/xoá được sự kiện của mình, không sửa được của người khác; OWNER sửa được tất cả")
    void editRights() throws Exception {
        long mine = id(create(member, once("Của con", "2026-12-20")));
        long ownersEvent = id(create(owner, once("Của bố", "2026-12-21")));

        api.put(member, event(mine), update("Của con (sửa)", "2026-12-20", 0)).andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Của con (sửa)")).andExpect(jsonPath("$.version").value(1));
        api.put(member, event(ownersEvent), update("Sửa trộm", "2026-12-21", 0)).andExpect(status().isForbidden());
        api.delete(member, event(ownersEvent)).andExpect(status().isForbidden());

        api.put(owner, event(mine), update("Bố sửa giúp", "2026-12-20", 1)).andExpect(status().isOk());
        api.delete(member, event(mine)).andExpect(status().isNoContent());
        api.get(owner, event(mine)).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("EVENT_NOT_FOUND"));
        range(owner, "2026-12-01", "2026-12-31").andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("Hai người cùng sửa: người lưu sau với version cũ nhận 409 VERSION_CONFLICT")
    void versionConflict() throws Exception {
        long id = id(create(owner, once("Họp mặt cuối năm", "2026-11-28")));
        api.put(owner, event(id), update("Họp mặt (giờ mới)", "2026-11-28", 0)).andExpect(status().isOk());
        api.put(owner, event(id), update("Bản sửa cũ", "2026-11-28", 0)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        api.get(owner, event(id)).andExpect(jsonPath("$.title").value("Họp mặt (giờ mới)"));
    }

    @Test
    @DisplayName("Người ngoài: 404; id sự kiện của gia đình khác: 404")
    void outsidersAndOtherFamilies() throws Exception {
        long id = id(create(owner, once("Riêng tư", "2026-12-20")));
        range(outsider, "2026-12-01", "2026-12-31").andExpect(status().isNotFound());
        api.get(outsider, event(id)).andExpect(status().isNotFound());

        long otherFamily = ((Number) TestApi.read(api.post(outsider, "/api/families", "{\"name\": \"Nhà khác\"}"), "$.id")).longValue();
        api.get(outsider, "/api/families/" + otherFamily + "/events/" + id).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EVENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("Khoảng ngày quá 400 ngày: 400 RANGE_TOO_LONG")
    void rangeLimit() throws Exception {
        range(owner, "2026-01-01", "2027-12-31").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RANGE_TOO_LONG"));
    }

    @Test
    @DisplayName("Sắp tới: tính từ hôm nay theo giờ Việt Nam, lọc đúng số ngày")
    void upcoming() throws Exception {
        LocalDate today = LocalDate.now(ClockConfig.VIETNAM);
        create(owner, once("Ba ngày nữa", today.plusDays(3).toString())).andExpect(status().isCreated());
        create(owner, once("Hai tháng nữa", today.plusDays(60).toString())).andExpect(status().isCreated());
        api.get(owner, base() + "/events/upcoming?days=7").andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Ba ngày nữa"));
    }

    private ResultActions create(String token, String body) throws Exception {
        return api.post(token, base() + "/events", body);
    }

    private ResultActions range(String token, String from, String to) throws Exception {
        return api.get(token, base() + "/events?from=" + from + "&to=" + to);
    }

    private static long id(ResultActions created) throws Exception {
        return ((Number) TestApi.read(created.andExpect(status().isCreated()), "$.id")).longValue();
    }

    private static String once(String title, String date) {
        return """
                {"type": "FAMILY_EVENT", "title": "%s", "calendarType": "SOLAR", "solarDate": "%s"}
                """.formatted(title, date);
    }

    private static String update(String title, String date, int version) {
        return """
                {"type": "FAMILY_EVENT", "title": "%s", "calendarType": "SOLAR", "solarDate": "%s", "version": %d}
                """.formatted(title, date, version);
    }

    private String base() {
        return "/api/families/" + familyId;
    }

    private String event(long id) {
        return base() + "/events/" + id;
    }
}

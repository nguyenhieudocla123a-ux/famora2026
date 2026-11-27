package com.famora.reminder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.famora.common.config.ClockConfig;
import com.famora.support.IntegrationTest;
import com.famora.support.MutableClock;
import com.famora.support.TestApi;

/**
 * The reminder pipeline end to end: settings -> planner -> reminder_schedules -> dispatcher -> notifications.
 * Time is moved with the test clock; tokens are only used while the clock is real.
 */
class ReminderFlowTest extends IntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MutableClock clock;

    @Autowired
    ReminderPlanner planner;

    @Autowired
    ReminderDispatcher dispatcher;

    TestApi api;
    String owner;
    String member;
    long familyId;
    long ownerId;
    long memberId;
    LocalDate today;
    long eventId;

    @BeforeEach
    void family() throws Exception {
        clock.reset();
        api = new TestApi(mvc);
        owner = api.newUser("Nguyễn Văn Hùng");
        member = api.newUser("Nguyễn Văn Hiếu");
        familyId = ((Number) TestApi.read(api.post(owner, "/api/families", "{\"name\": \"Nhà họ Nguyễn\"}"), "$.id")).longValue();
        String code = TestApi.read(api.post(owner, base() + "/invitations", "{}"), "$.code");
        api.post(member, "/api/families/join", "{\"code\": \"%s\"}".formatted(code)).andExpect(status().isOk());
        ownerId = ((Number) TestApi.read(api.get(owner, "/api/users/me"), "$.id")).longValue();
        memberId = ((Number) TestApi.read(api.get(member, "/api/users/me"), "$.id")).longValue();

        today = LocalDate.now(ClockConfig.VIETNAM);
        eventId = ((Number) TestApi.read(api.post(owner, base() + "/events", """
                {"type": "FAMILY_EVENT", "title": "Họp mặt gia đình", "calendarType": "SOLAR",
                 "solarDate": "%s", "startTime": "10:00"}
                """.formatted(today.plusDays(10))).andExpect(status().isCreated()), "$.id")).longValue();
    }

    @AfterEach
    void realTime() {
        clock.reset();
    }

    @Test
    @DisplayName("Tạo sự kiện là tự lên lịch: mặc định nhắc trước 7 và 1 ngày lúc 8:00, cho mọi thành viên")
    void defaultPlan() {
        assertThat(pending(ownerId)).containsExactlyInAnyOrder(at(today.plusDays(3), 8), at(today.plusDays(9), 8));
        assertThat(pending(memberId)).containsExactlyInAnyOrder(at(today.plusDays(3), 8), at(today.plusDays(9), 8));
    }

    @Test
    @DisplayName("Đến 8:00 ngày nhắc: mỗi người nhận một thông báo; chạy lại không gửi trùng")
    void dispatchAtTheRightMoment() throws Exception {
        // the database is shared with other test classes: count this event's reminders, not the dispatcher's total
        clock.set(at(today.plusDays(3), 8).minusSeconds(60));
        dispatcher.dispatchDue();
        assertThat(sent()).as("one minute early: nothing").isZero();

        clock.set(at(today.plusDays(3), 8).plusSeconds(30));
        dispatcher.dispatchDue();
        assertThat(sent()).isEqualTo(2);
        dispatcher.dispatchDue();
        assertThat(sent()).as("already sent, not sent again").isEqualTo(2);
        planner.replan(eventId);
        assertThat(pending(memberId)).as("re-planning does not resurrect a sent reminder")
                .containsExactly(at(today.plusDays(9), 8));
        clock.reset();

        api.get(member, "/api/notifications").andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.unreadCount").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Họp mặt gia đình"))
                .andExpect(jsonPath("$.items[0].type").value("REMINDER"))
                .andExpect(jsonPath("$.items[0].refId").value(eventId))
                .andExpect(jsonPath("$.items[0].body").value(org.hamcrest.Matchers.startsWith("Còn 7 ngày: ")))
                .andExpect(jsonPath("$.items[0].body").value(org.hamcrest.Matchers.endsWith(" lúc 10:00")));
    }

    @Test
    @DisplayName("Cài đặt riêng: tắt nhắc chỉ ảnh hưởng mình; xoá cài đặt riêng thì về mặc định")
    void personalSetting() throws Exception {
        api.put(member, reminders() + "/me", "{\"offsets\": []}").andExpect(status().isOk())
                .andExpect(jsonPath("$.effective.offsets.length()").value(0));
        assertThat(pending(memberId)).isEmpty();
        assertThat(pending(ownerId)).hasSize(2);

        api.put(member, reminders() + "/me", "{\"offsets\": [0, 2, 2], \"time\": \"06:30\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.mine.offsets[0]").value(2))
                .andExpect(jsonPath("$.mine.offsets[1]").value(0));
        assertThat(pending(memberId)).containsExactlyInAnyOrder(at(today.plusDays(8), 6, 30), at(today.plusDays(10), 6, 30));

        api.delete(member, reminders() + "/me").andExpect(status().isOk())
                .andExpect(jsonPath("$.mine").doesNotExist())
                .andExpect(jsonPath("$.effective.offsets[0]").value(7));
        assertThat(pending(memberId)).hasSize(2);
    }

    @Test
    @DisplayName("Cài đặt chung: chỉ người sửa được sự kiện mới đổi được; áp dụng cho ai chưa có cài đặt riêng")
    void familySetting() throws Exception {
        api.put(member, reminders() + "/family", "{\"offsets\": [3]}").andExpect(status().isForbidden());
        api.put(owner, reminders() + "/family", "{\"offsets\": [3], \"time\": \"19:00\"}").andExpect(status().isOk());
        assertThat(pending(memberId)).containsExactly(at(today.plusDays(7), 19));
        api.put(owner, reminders() + "/family", "{\"offsets\": [31]}").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Đổi ngày sự kiện thì lên lịch lại; xoá sự kiện thì huỷ hết nhắc chưa gửi")
    void eventChangesReplan() throws Exception {
        api.put(owner, base() + "/events/" + eventId, """
                {"type": "FAMILY_EVENT", "title": "Họp mặt gia đình", "calendarType": "SOLAR",
                 "solarDate": "%s", "version": 0}
                """.formatted(today.plusDays(20))).andExpect(status().isOk());
        assertThat(pending(ownerId)).containsExactlyInAnyOrder(at(today.plusDays(13), 8), at(today.plusDays(19), 8));

        api.delete(owner, base() + "/events/" + eventId).andExpect(status().isNoContent());
        assertThat(pending(ownerId)).isEmpty();
        assertThat(pending(memberId)).isEmpty();
    }

    @Test
    @DisplayName("Người đã rời gia đình trước giờ nhắc: không gửi cho họ")
    void leftMemberIsSkipped() throws Exception {
        api.post(member, base() + "/leave", null).andExpect(status().isNoContent());
        clock.set(at(today.plusDays(3), 8).plusSeconds(30));
        dispatcher.dispatchDue();
        assertThat(sent()).as("the owner only").isEqualTo(1);
        clock.reset();
        api.get(member, "/api/notifications/unread-count").andExpect(jsonPath("$.count").value(0));
    }

    @Test
    @DisplayName("Chạy planner cả đêm nhiều lần: không sinh nhắc trùng")
    void nightlyPlanIsIdempotent() {
        planner.planAll();
        planner.planAll();
        Integer rows = jdbc.queryForObject("select count(*) from reminder_schedules where event_id = ?", Integer.class, eventId);
        assertThat(rows).isEqualTo(4);
    }

    @Test
    @DisplayName("Thông báo: đánh dấu đã đọc, đọc hết, lọc chưa đọc; không đụng được thông báo của người khác")
    void notificationsApi() throws Exception {
        api.put(owner, reminders() + "/me", "{\"offsets\": [9, 3]}").andExpect(status().isOk());
        clock.set(at(today.plusDays(3), 8).plusSeconds(30));
        dispatcher.dispatchDue();
        clock.set(at(today.plusDays(7), 8).plusSeconds(30));
        dispatcher.dispatchDue();
        clock.reset();

        List<Number> ids = TestApi.read(api.get(owner, "/api/notifications"), "$.items[*].id");
        assertThat(ids).hasSize(2);
        api.get(owner, "/api/notifications/unread-count").andExpect(jsonPath("$.count").value(2));

        api.put(member, "/api/notifications/" + ids.get(0) + "/read", null).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOTIFICATION_NOT_FOUND"));
        api.put(owner, "/api/notifications/" + ids.get(0) + "/read", null).andExpect(status().isNoContent());
        api.get(owner, "/api/notifications?unreadOnly=true").andExpect(jsonPath("$.items.length()").value(1));
        api.put(owner, "/api/notifications/read-all", null).andExpect(status().isNoContent());
        api.get(owner, "/api/notifications/unread-count").andExpect(jsonPath("$.count").value(0));
    }

    private int sent() {
        return jdbc.queryForObject("select count(*) from reminder_schedules where event_id = ? and status = 'SENT'",
                Integer.class, eventId);
    }

    private List<Instant> pending(long userId) {
        return jdbc.queryForList("select fire_at from reminder_schedules where event_id = ? and user_id = ? "
                + "and status = 'PENDING'", java.sql.Timestamp.class, eventId, userId)
                .stream().map(java.sql.Timestamp::toInstant).toList();
    }

    private static Instant at(LocalDate day, int hour) {
        return at(day, hour, 0);
    }

    private static Instant at(LocalDate day, int hour, int minute) {
        return LocalDateTime.of(day, LocalTime.of(hour, minute)).atZone(ClockConfig.VIETNAM).toInstant();
    }

    private String base() {
        return "/api/families/" + familyId;
    }

    private String reminders() {
        return base() + "/events/" + eventId + "/reminders";
    }
}

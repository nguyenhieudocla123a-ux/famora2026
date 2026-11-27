package com.famora.person;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.famora.support.IntegrationTest;
import com.famora.support.TestApi;

class PersonApiTest extends IntegrationTest {

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
    @DisplayName("Người đã khuất, nhập ngày mất dương: tự ra ngày âm, tự tạo giỗ hằng năm gắn với hồ sơ")
    void deceasedWithSolarDeathDateAndAnniversary() throws Exception {
        // 21/10 âm năm 2025, whatever solar day that is
        String deathDate = TestApi.read(api.get(owner, "/api/calendar/convert?lunarDay=21&lunarMonth=10&lunarYear=2025"), "$.date");

        ResultActions created = create(owner, """
                {"fullName": "Phạm Thị Hòa", "nickname": "Bà nội", "gender": "FEMALE", "deceased": true,
                 "deathDateSolar": "%s", "createAnniversary": true}
                """.formatted(deathDate))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deathLunarDay").value(21))
                .andExpect(jsonPath("$.deathLunarMonth").value(10))
                .andExpect(jsonPath("$.anniversaryEventId").isNumber())
                .andExpect(jsonPath("$.nextAnniversary").isNotEmpty());
        long personId = ((Number) TestApi.read(created, "$.id")).longValue();
        long eventId = ((Number) TestApi.read(created, "$.anniversaryEventId")).longValue();
        String next = TestApi.read(created, "$.nextAnniversary");

        api.get(owner, base() + "/events/" + eventId).andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Giỗ Bà nội"))
                .andExpect(jsonPath("$.type").value("DEATH_ANNIVERSARY"))
                .andExpect(jsonPath("$.lunarYear").value(2025))
                .andExpect(jsonPath("$.personIds[0]").value(personId));
        // the profile's "next giỗ" is the event's first upcoming occurrence
        List<String> upcoming = TestApi.read(api.get(owner, base() + "/events/upcoming?days=365"),
                "$[?(@.eventId == " + eventId + ")].date");
        assertThat(upcoming).first().isEqualTo(next);
    }

    @Test
    @DisplayName("Chỉ biết ngày âm (không rõ năm): giỗ 8/12 âm, sự kiện không có năm gốc")
    void lunarOnlyDeathDate() throws Exception {
        ResultActions created = create(owner, """
                {"fullName": "Nguyễn Văn Phúc", "nickname": "Ông nội", "deceased": true,
                 "deathLunarDay": 8, "deathLunarMonth": 12, "createAnniversary": true}
                """).andExpect(status().isCreated())
                .andExpect(jsonPath("$.deathDateSolar").doesNotExist())
                .andExpect(jsonPath("$.nextAnniversary").isNotEmpty());
        long eventId = ((Number) TestApi.read(created, "$.anniversaryEventId")).longValue();
        api.get(owner, base() + "/events/" + eventId).andExpect(jsonPath("$.lunarYear").doesNotExist());
    }

    @Test
    @DisplayName("Dữ liệu ngày mất không hợp lý: 400 với mã lỗi rõ ràng")
    void invalidDeathDetails() throws Exception {
        create(owner, "{\"fullName\": \"Bé An\", \"deceased\": false, \"deathLunarDay\": 1, \"deathLunarMonth\": 1}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("DEATH_DETAILS_FOR_LIVING"));
        String deathDate = TestApi.read(api.get(owner, "/api/calendar/convert?lunarDay=21&lunarMonth=10&lunarYear=2025"), "$.date");
        create(owner, """
                {"fullName": "Bà", "deceased": true, "deathDateSolar": "%s", "deathLunarDay": 5, "deathLunarMonth": 3}
                """.formatted(deathDate))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("DEATH_DATES_DISAGREE"));
        create(owner, "{\"fullName\": \"Ông\", \"deceased\": true, \"createAnniversary\": true}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("ANNIVERSARY_NEEDS_DATE"));
        create(owner, "{\"fullName\": \"Ông\", \"deceased\": true, \"deathDateSolar\": \"2999-01-01\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("MEMBER xem được, không thêm/sửa/xoá được (403); người ngoài 404")
    void permissions() throws Exception {
        long id = ((Number) TestApi.read(create(owner, "{\"fullName\": \"Nguyễn Minh An\", \"nickname\": \"Bé An\"}"), "$.id")).longValue();
        api.get(member, base() + "/persons").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        create(member, "{\"fullName\": \"Ai đó\"}").andExpect(status().isForbidden());
        api.put(member, base() + "/persons/" + id, "{\"fullName\": \"Đổi tên\"}").andExpect(status().isForbidden());
        api.delete(member, base() + "/persons/" + id).andExpect(status().isForbidden());
        api.get(outsider, base() + "/persons").andExpect(status().isNotFound());
        api.get(outsider, base() + "/persons/" + id).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Gắn hồ sơ với tài khoản thành viên: mỗi thành viên một hồ sơ; thành viên gia đình khác 404")
    void linkToMember() throws Exception {
        List<Number> memberIds = TestApi.read(api.get(owner, base() + "/members"), "$[*].id");
        long memberMemberId = memberIds.get(1).longValue();
        create(owner, "{\"fullName\": \"Nguyễn Văn Hiếu\", \"memberId\": %d}".formatted(memberMemberId))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.memberId").value(memberMemberId));
        create(owner, "{\"fullName\": \"Bản trùng\", \"memberId\": %d}".formatted(memberMemberId))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("MEMBER_ALREADY_LINKED"));

        long otherFamily = ((Number) TestApi.read(api.post(outsider, "/api/families", "{\"name\": \"Nhà khác\"}"), "$.id")).longValue();
        long outsiderMemberId = ((Number) TestApi.<List<Number>>read(
                api.get(outsider, "/api/families/" + otherFamily + "/members"), "$[*].id").get(0)).longValue();
        create(owner, "{\"fullName\": \"Người lạ\", \"memberId\": %d}".formatted(outsiderMemberId))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MEMBER_NOT_FOUND"));
    }

    @Test
    @DisplayName("Xoá hồ sơ: sự kiện vẫn còn, chỉ mất liên kết; gắn người của gia đình khác vào sự kiện: 404")
    void deleteKeepsEventsAndLinksStayInFamily() throws Exception {
        ResultActions created = create(owner, """
                {"fullName": "Nguyễn Văn Phúc", "deceased": true, "deathLunarDay": 8, "deathLunarMonth": 12,
                 "createAnniversary": true}
                """);
        long personId = ((Number) TestApi.read(created, "$.id")).longValue();
        long eventId = ((Number) TestApi.read(created, "$.anniversaryEventId")).longValue();

        api.delete(owner, base() + "/persons/" + personId).andExpect(status().isNoContent());
        api.get(owner, base() + "/persons/" + personId).andExpect(status().isNotFound());
        api.get(owner, base() + "/events/" + eventId).andExpect(status().isOk())
                .andExpect(jsonPath("$.personIds.length()").value(0));

        long otherFamily = ((Number) TestApi.read(api.post(outsider, "/api/families", "{\"name\": \"Nhà khác\"}"), "$.id")).longValue();
        long foreignPerson = ((Number) TestApi.read(api.post(outsider, "/api/families/" + otherFamily + "/persons",
                "{\"fullName\": \"Người nhà khác\"}"), "$.id")).longValue();
        api.post(owner, base() + "/events", """
                {"type": "FAMILY_EVENT", "title": "Họp", "calendarType": "SOLAR", "solarDate": "2026-12-20",
                 "personIds": [%d]}
                """.formatted(foreignPerson)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PERSON_NOT_FOUND"));
    }

    private ResultActions create(String token, String body) throws Exception {
        return api.post(token, base() + "/persons", body);
    }

    private String base() {
        return "/api/families/" + familyId;
    }
}

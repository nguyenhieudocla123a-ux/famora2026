package com.famora.person;

import java.time.LocalDate;

import com.famora.person.FamilyPerson.Gender;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public final class PersonDtos {

    private PersonDtos() {
    }

    /**
     * Create and update share this body. Give the death date in solar ({@code deathDateSolar}, the lunar date is
     * then computed) or only in lunar ({@code deathLunarDay} + {@code deathLunarMonth}) when the year is unknown.
     * {@code createAnniversary} (create only) also adds a yearly lunar "Giỗ ..." event linked to this profile.
     */
    public record PersonRequest(
            @NotBlank(message = "Nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") String fullName,
            @Size(max = 50, message = "Cách gọi tối đa 50 ký tự") String nickname,
            Gender gender,
            @PastOrPresent(message = "Ngày sinh không thể ở tương lai") LocalDate birthDateSolar,
            Boolean deceased,
            @PastOrPresent(message = "Ngày mất không thể ở tương lai") LocalDate deathDateSolar,
            @Min(value = 1, message = "Ngày âm từ 1 đến 30") @Max(value = 30, message = "Ngày âm từ 1 đến 30") Integer deathLunarDay,
            @Min(value = 1, message = "Tháng âm từ 1 đến 12") @Max(value = 12, message = "Tháng âm từ 1 đến 12") Integer deathLunarMonth,
            Boolean deathLunarLeap,
            Long memberId,
            Boolean createAnniversary) {
    }

    /**
     * @param nextAnniversary the next ngày giỗ from today (Vietnam time), for a departed relative with a lunar date
     * @param anniversaryEventId the giỗ event created with the profile, when asked for
     */
    public record PersonResponse(Long id, Long memberId, String fullName, String nickname, Gender gender,
            LocalDate birthDateSolar, boolean deceased, LocalDate deathDateSolar, Integer deathLunarDay,
            Integer deathLunarMonth, boolean deathLunarLeap, LocalDate nextAnniversary, Long anniversaryEventId) {
    }
}

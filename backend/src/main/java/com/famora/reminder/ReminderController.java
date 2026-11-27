package com.famora.reminder;

import java.time.LocalTime;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.famora.common.security.CurrentUser;
import com.famora.reminder.ReminderSettingsService.SettingsView;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/families/{familyId}/events/{eventId}/reminders")
public class ReminderController {

    private final ReminderSettingsService reminders;

    public ReminderController(ReminderSettingsService reminders) {
        this.reminders = reminders;
    }

    /** offsets: days before (0 = on the day); an empty list turns reminders off. time: Vietnam time. */
    public record SettingRequest(
            @NotNull(message = "Chọn số ngày nhắc trước")
            @Size(max = 5, message = "Tối đa 5 lần nhắc")
            List<@NotNull @Min(value = 0, message = "Nhắc trước từ 0 đến 30 ngày")
                    @Max(value = 30, message = "Nhắc trước từ 0 đến 30 ngày") Integer> offsets,
            LocalTime time) {
    }

    @GetMapping
    public SettingsView get(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId, @PathVariable long eventId) {
        return reminders.get(familyId, CurrentUser.id(jwt), eventId);
    }

    @PutMapping("/me")
    public SettingsView setMine(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long eventId, @Valid @RequestBody SettingRequest req) {
        return reminders.setMine(familyId, CurrentUser.id(jwt), eventId, req.offsets(), req.time());
    }

    @DeleteMapping("/me")
    public SettingsView clearMine(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long eventId) {
        return reminders.clearMine(familyId, CurrentUser.id(jwt), eventId);
    }

    @PutMapping("/family")
    public SettingsView setFamily(@AuthenticationPrincipal Jwt jwt, @PathVariable long familyId,
            @PathVariable long eventId, @Valid @RequestBody SettingRequest req) {
        return reminders.setFamily(familyId, CurrentUser.id(jwt), eventId, req.offsets(), req.time());
    }
}

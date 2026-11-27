package com.famora.reminder;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReminderSettingRepository extends JpaRepository<ReminderSetting, Long> {

    List<ReminderSetting> findByEventId(Long eventId);

    Optional<ReminderSetting> findByEventIdAndUserId(Long eventId, Long userId);

    Optional<ReminderSetting> findByEventIdAndUserIdIsNull(Long eventId);
}

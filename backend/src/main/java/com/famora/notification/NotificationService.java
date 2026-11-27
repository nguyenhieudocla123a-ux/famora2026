package com.famora.notification;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;

/** In-app notifications. Every read or change is limited to the caller's own notifications. */
@Service
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final NotificationRepository notifications;
    private final ApplicationEventPublisher publisher;
    private final Clock clock;

    public NotificationService(NotificationRepository notifications, ApplicationEventPublisher publisher,
            Clock clock) {
        this.notifications = notifications;
        this.publisher = publisher;
        this.clock = clock;
    }

    /**
     * Stores a notification and announces it. Listeners (the realtime push in Phase 6b) act only after the
     * transaction commits, so nobody is told about a notification that was then rolled back.
     */
    @Transactional
    public NotificationView create(long userId, Long familyId, String type, String title, String body,
            String refType, Long refId) {
        Notification saved = notifications.save(new Notification(userId, familyId, type, title, body, refType, refId,
                Instant.now(clock)));
        NotificationView view = NotificationView.of(saved);
        publisher.publishEvent(new NotificationCreated(userId, view));
        return view;
    }

    @Transactional(readOnly = true)
    public PageView list(long userId, boolean unreadOnly, int page, int size) {
        PageRequest req = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), MAX_PAGE_SIZE));
        Page<Notification> result = unreadOnly
                ? notifications.findByUserIdAndReadAtIsNullOrderByCreatedAtDescIdDesc(userId, req)
                : notifications.findByUserIdOrderByCreatedAtDescIdDesc(userId, req);
        return new PageView(result.map(NotificationView::of).getContent(), result.getNumber(), result.getSize(),
                result.hasNext(), notifications.countByUserIdAndReadAtIsNull(userId));
    }

    @Transactional(readOnly = true)
    public long unreadCount(long userId) {
        return notifications.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(long userId, long notificationId) {
        notifications.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND))
                .markRead(Instant.now(clock));
    }

    @Transactional
    public void markAllRead(long userId) {
        notifications.markAllRead(userId, Instant.now(clock));
    }

    /** Housekeeping: notifications older than {@code before} are deleted for good (technical data). */
    @Transactional
    public int deleteOlderThan(Instant before) {
        return notifications.deleteOlderThan(before);
    }

    public record NotificationView(Long id, Long familyId, String type, String title, String body, String refType,
            Long refId, boolean read, Instant createdAt) {

        static NotificationView of(Notification n) {
            return new NotificationView(n.getId(), n.getFamilyId(), n.getType(), n.getTitle(), n.getBody(),
                    n.getRefType(), n.getRefId(), n.getReadAt() != null, n.getCreatedAt());
        }
    }

    public record PageView(List<NotificationView> items, int page, int size, boolean hasNext, long unreadCount) {
    }

    /** Published inside the creating transaction; handle it with @TransactionalEventListener(AFTER_COMMIT). */
    public record NotificationCreated(long userId, NotificationView notification) {
    }
}

package com.famora.notification.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import com.famora.notification.NotificationService.NotificationCreated;

/**
 * Pushes each new notification to its owner's open connections, only after the notification is committed.
 * Nobody connected? Nothing is lost: the app reads /api/notifications when it opens.
 */
@Component
public class StompNotificationPublisher {

    private static final Logger log = LoggerFactory.getLogger(StompNotificationPublisher.class);
    private static final String QUEUE = "/queue/notifications";

    private final SimpMessagingTemplate messaging;

    public StompNotificationPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(fallbackExecution = true)
    public void onCreated(NotificationCreated created) {
        try {
            messaging.convertAndSendToUser(Long.toString(created.userId()), QUEUE, created.notification());
        } catch (RuntimeException e) {
            // a push failure must never affect anything else: the notification is already saved
            log.warn("Could not push notification {} to user {}", created.notification().id(), created.userId(), e);
        }
    }
}

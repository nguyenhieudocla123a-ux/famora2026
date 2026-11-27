package com.famora.notification.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import com.famora.auth.AuthService;
import com.famora.auth.dto.LoginRequest;
import com.famora.auth.dto.RegisterRequest;
import com.famora.notification.NotificationService;
import com.famora.support.RealServerTest;

/** A real STOMP client over a real socket, the way the phone app will connect. */
class RealtimeNotificationTest extends RealServerTest {

    @Autowired
    AuthService auth;

    @Autowired
    NotificationService notifications;

    @Autowired
    SimpUserRegistry registry;

    WebSocketStompClient stomp;

    @BeforeEach
    void client() {
        stomp = new WebSocketStompClient(new StandardWebSocketClient());
        stomp.setMessageConverter(new JacksonJsonMessageConverter()); // the server sends application/json
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.initialize();
        stomp.setTaskScheduler(scheduler); // needed to track SUBSCRIBE receipts
    }

    @AfterEach
    void stop() {
        stomp.stop();
    }

    @Test
    @DisplayName("Đăng nhập rồi đăng ký kênh của mình: thông báo mới đến ngay")
    void receivesOwnNotification() throws Exception {
        User a = user("Trần Thị Lan");
        BlockingQueue<Map<String, Object>> inbox = subscribe(connect(a.token()), a.id());

        notifications.create(a.id(), null, "TEST", "Giỗ bà nội", "Ngày mai: Chủ nhật 29/11/2026", "EVENT", 1L);

        Map<String, Object> received = inbox.poll(5, TimeUnit.SECONDS);
        assertThat(received).isNotNull().containsEntry("title", "Giỗ bà nội").containsEntry("read", false)
                .containsEntry("type", "TEST");
    }

    @Test
    @DisplayName("Thông báo của người khác không đến kênh của mình")
    void othersNotificationsStayPrivate() throws Exception {
        User a = user("Người A");
        User b = user("Người B");
        BlockingQueue<Map<String, Object>> inboxA = subscribe(connect(a.token()), a.id());
        BlockingQueue<Map<String, Object>> inboxB = subscribe(connect(b.token()), b.id());

        notifications.create(a.id(), null, "TEST", "Chỉ cho A", "riêng tư", null, null);

        assertThat(inboxA.poll(5, TimeUnit.SECONDS)).isNotNull().containsEntry("title", "Chỉ cho A");
        assertThat(inboxB.poll(1500, TimeUnit.MILLISECONDS)).isNull();
    }

    @Test
    @DisplayName("Không có token hoặc token giả: không kết nối được")
    void needsAValidToken() {
        assertThatThrownBy(() -> connectFuture(null).get(5, TimeUnit.SECONDS))
                .isInstanceOfAny(ExecutionException.class, TimeoutException.class);
        assertThatThrownBy(() -> connectFuture("khong.phai.jwt").get(5, TimeUnit.SECONDS))
                .isInstanceOfAny(ExecutionException.class, TimeoutException.class);
    }

    @Test
    @DisplayName("Đăng ký kênh khác kênh của mình: bị ngắt kết nối")
    void cannotSubscribeElsewhere() throws Exception {
        StompSession session = connect(user("Tò mò").token());
        session.subscribe("/queue/notifications-user1", new Collector(new LinkedBlockingQueue<>()));
        long deadline = System.currentTimeMillis() + 5000;
        while (session.isConnected() && System.currentTimeMillis() < deadline) {
            Thread.sleep(100);
        }
        assertThat(session.isConnected()).isFalse();
    }

    private StompSession connect(String token) throws Exception {
        return connectFuture(token).get(5, TimeUnit.SECONDS);
    }

    private CompletableFuture<StompSession> connectFuture(String token) {
        StompHeaders headers = new StompHeaders();
        if (token != null) {
            headers.add("Authorization", "Bearer " + token);
        }
        return stomp.connectAsync("ws://localhost:" + port + "/ws", new WebSocketHttpHeaders(), headers,
                new StompSessionHandlerAdapter() {
                });
    }

    /**
     * Subscribes, then waits until the server has registered the subscription (the simple broker sends no
     * RECEIPT frames), so nothing published afterwards can be missed.
     */
    private BlockingQueue<Map<String, Object>> subscribe(StompSession session, long userId) throws Exception {
        BlockingQueue<Map<String, Object>> inbox = new LinkedBlockingQueue<>();
        session.subscribe("/user/queue/notifications", new Collector(inbox));
        long deadline = System.currentTimeMillis() + 5000;
        while (!subscribed(userId)) {
            if (System.currentTimeMillis() > deadline) {
                throw new TimeoutException("subscription not registered");
            }
            Thread.sleep(50);
        }
        return inbox;
    }

    private boolean subscribed(long userId) {
        var user = registry.getUser(Long.toString(userId));
        return user != null && user.getSessions().stream().anyMatch(s -> !s.getSubscriptions().isEmpty());
    }

    private User user(String name) {
        String email = "rt" + UUID.randomUUID().toString().substring(0, 8) + "@famora.example";
        long id = auth.register(new RegisterRequest(email, "matkhau123", name)).id();
        return new User(id, auth.login(new LoginRequest(email, "matkhau123")).accessToken());
    }

    private record User(long id, String token) {
    }

    private record Collector(BlockingQueue<Map<String, Object>> inbox) implements StompFrameHandler {

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return Map.class;
        }

        @Override
        @SuppressWarnings("unchecked")
        public void handleFrame(StompHeaders headers, Object payload) {
            inbox.add((Map<String, Object>) payload);
        }
    }
}

package com.famora.notification.realtime;

import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Guards every STOMP frame a client sends:
 * <ul>
 * <li>CONNECT must carry "Authorization: Bearer access-token" (the same JWT as the REST API); the connection
 * then belongs to that user id.</li>
 * <li>SUBSCRIBE is allowed to the caller's own queue only.</li>
 * <li>SEND is refused: clients only listen; they act through the REST API.</li>
 * </ul>
 * The WebSocket handshake itself is open, so this interceptor is the only gate: it fails closed.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    static final String NOTIFICATIONS = "/user/queue/notifications";

    private final JwtDecoder jwtDecoder;

    public StompAuthInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor stomp = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (stomp == null || stomp.getCommand() == null) {
            return message;
        }
        StompCommand command = stomp.getCommand();
        switch (command) {
            case CONNECT, STOMP -> stomp.setUser(authenticate(stomp.getNativeHeader("Authorization")));
            case SUBSCRIBE -> {
                requireUser(stomp);
                if (!NOTIFICATIONS.equals(stomp.getDestination())) {
                    throw new MessageDeliveryException("Chỉ được nhận thông báo của chính mình");
                }
            }
            case SEND -> throw new MessageDeliveryException("Không hỗ trợ gửi qua WebSocket");
            default -> {
                // DISCONNECT, UNSUBSCRIBE, ACK...: harmless
            }
        }
        return message;
    }

    private JwtAuthenticationToken authenticate(List<String> header) {
        String value = header == null || header.isEmpty() ? null : header.get(0);
        if (value == null || !value.startsWith("Bearer ")) {
            throw new MessageDeliveryException("Thiếu token đăng nhập");
        }
        try {
            Jwt jwt = jwtDecoder.decode(value.substring("Bearer ".length()));
            // the principal's name is the JWT subject = user id, used to address /user/{id}/queue/...
            return new JwtAuthenticationToken(jwt, List.of(), jwt.getSubject());
        } catch (JwtException e) {
            throw new MessageDeliveryException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    private static void requireUser(StompHeaderAccessor stomp) {
        if (stomp.getUser() == null) {
            throw new MessageDeliveryException("Bạn cần đăng nhập");
        }
    }
}

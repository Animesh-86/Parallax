package com.parallax.backend.parallax.websocket.publisher;

import com.parallax.backend.parallax.dto.collaborator.InviteNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class InviteWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send invite-related notification to a single user
     */
    public void notifyUser(UUID userId, InviteNotification payload) {
        log.info("🔔 Dispatched {} notification to user: {}", payload.type(), userId);
        messagingTemplate.convertAndSend(
                "/topic/user/" + userId,
                payload
        );
    }
}

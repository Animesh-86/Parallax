package com.parallax.backend.parallax.websocket.publisher;

import com.parallax.backend.parallax.dto.collaborator.InviteNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class InviteWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send invite-related notification to a single user
     */
    public void notifyUser(UUID userId, InviteNotification payload) {
        messagingTemplate.convertAndSend(
                "/topic/user/" + userId,
                payload
        );
    }
}

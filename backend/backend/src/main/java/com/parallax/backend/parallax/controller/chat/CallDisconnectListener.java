package com.parallax.backend.parallax.controller.chat;

import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.chat.CallService;
import com.parallax.backend.parallax.store.CallSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CallDisconnectListener {

    private final CallSessionRegistry registry;
    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if(principal == null) return;

        UUID userId = AuthUtil.requireUserId(principal);
        UUID projectId = registry.getProjectForUser(userId);

        if (projectId == null) return;

        callService.leaveCall(projectId, userId);

        // Notify others using the same schema as frontend voice signaling.
        Map<String, Object> leaveMsg = Map.of(
            "type", "CALL_LEAVE",
            "projectId", projectId.toString(),
            "senderId", userId.toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/project/" + projectId + "/call",
            (Object) leaveMsg
        );
    }
}

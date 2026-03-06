package com.parallax.backend.parallax.config;

import com.parallax.backend.parallax.service.session.SessionFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WebSocketDisconnectListener {

    private final SessionFacade sessionFacade;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());

        Principal principal = accessor.getUser();
        if (principal == null) return;

        UUID userId = UUID.fromString(principal.getName());

        // 🔥 Correct cleanup
        sessionFacade.userLeftEverywhere(userId);
    }
}

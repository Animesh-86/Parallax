package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.dto.presence.PresenceEvent;
import com.parallax.backend.parallax.dto.presence.PresenceEventType;
import com.parallax.backend.parallax.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatPresenceListener {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @Async
    @EventListener
    public void onPresenceEvent(PresenceEvent event) {
        // We only care about JOIN/LEFT for now to create system messages
        if (event.getType() == PresenceEventType.USER_JOINED) {
            String username = getUsername(event.getUserId());
            chatService.systemMessage(event.getProjectId(), username + " joined the workspace.");
        } else if (event.getType() == PresenceEventType.USER_LEFT) {
            String username = getUsername(event.getUserId());
            chatService.systemMessage(event.getProjectId(), username + " left the workspace.");
        }
    }

    private String getUsername(java.util.UUID userId) {
        return userRepository.findById(userId)
                .map(u -> u.getUsername())
                .orElse("Unknown User");
    }
}

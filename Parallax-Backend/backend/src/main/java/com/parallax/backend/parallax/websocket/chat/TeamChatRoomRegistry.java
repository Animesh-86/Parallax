package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.entity.chat.TeamChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamChatRoomRegistry {

    private final ObjectMapper objectMapper;

    private final Map<UUID, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<String, UUID> sessionTeamMap = new ConcurrentHashMap<>();

    public void join(UUID teamId, WebSocketSession session) {
        rooms.computeIfAbsent(teamId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionTeamMap.put(session.getId(), teamId);
    }

    public void leave(WebSocketSession session) {
        UUID teamId = sessionTeamMap.remove(session.getId());
        if (teamId != null) {
            Set<WebSocketSession> sessions = rooms.get(teamId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    rooms.remove(teamId);
                }
            }
        }
    }

    public void broadcast(UUID teamId, TeamChatMessage message) {
        Set<WebSocketSession> sessions = rooms.get(teamId);
        if (sessions == null || sessions.isEmpty()) return;

        try {
            String payload = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(payload);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.warn("Failed to send team chat to session {}", session.getId(), e);
                    }
                }
            }
        } catch (IOException e) {
            log.error("Failed to serialize team chat message", e);
        }
    }
}

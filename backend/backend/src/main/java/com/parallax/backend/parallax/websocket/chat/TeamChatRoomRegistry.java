package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.entity.chat.TeamChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class TeamChatRoomRegistry {

    private static final Logger log = LoggerFactory.getLogger(TeamChatRoomRegistry.class);

    private final ObjectMapper objectMapper;

    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();

    public TeamChatRoomRegistry(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void join(UUID teamId, UUID channelId, WebSocketSession session) {
        String roomId = teamId.toString() + ":" + channelId.toString();
        rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionRoomMap.put(session.getId(), roomId);
    }

    public void leave(WebSocketSession session) {
        String roomId = sessionRoomMap.remove(session.getId());
        if (roomId != null) {
            Set<WebSocketSession> sessions = rooms.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    rooms.remove(roomId);
                }
            }
        }
    }

    public void broadcast(UUID teamId, UUID channelId, TeamChatMessage message) {
        String roomId = teamId.toString() + ":" + channelId.toString();
        Set<WebSocketSession> sessions = rooms.get(roomId);
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

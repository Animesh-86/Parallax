package com.parallax.backend.parallax.websocket.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parallax.backend.parallax.entity.chat.DirectMessage;
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
public class DirectChatRegistry {

    private final ObjectMapper objectMapper;

    // userId -> Set<Session> (A user might have multiple active tabs)
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    
    // sessionId -> userId (for quick lookup on disconnect)
    private final Map<String, UUID> sessionUserMap = new ConcurrentHashMap<>();

    public void join(UUID userId, WebSocketSession session) {
        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionUserMap.put(session.getId(), userId);
    }

    public void leave(WebSocketSession session) {
        UUID userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
        }
    }

    public void broadcast(UUID senderId, UUID receiverId, DirectMessage message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(payload);

            // Send to sender's other tabs
            sendToUser(senderId, textMessage);

            // Send to receiver
            sendToUser(receiverId, textMessage);

        } catch (IOException e) {
            log.error("Failed to serialize direct message", e);
        }
    }

    private void sendToUser(UUID userId, TextMessage message) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) return;

        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException e) {
                    log.warn("Failed to send message to session {}", session.getId(), e);
                }
            }
        }
    }
}

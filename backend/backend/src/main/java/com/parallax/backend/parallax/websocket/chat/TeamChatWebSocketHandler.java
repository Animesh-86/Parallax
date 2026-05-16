package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.service.chat.TeamChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamChatWebSocketHandler extends TextWebSocketHandler {

    private final TeamChatService teamChatService;
    private final TeamChatRoomRegistry roomRegistry;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID teamId = getTeamId(session);
        UUID userId = getUserId(session);
        String username = getUsername(session);

        roomRegistry.join(teamId, session);
        log.info("User {} ({}) joined team chat {}", username, userId, teamId);

        // Send history
        var history = teamChatService.getRecentMessages(teamId);
        String payload = objectMapper.writeValueAsString(Map.of(
                "type", "HISTORY",
                "messages", history));
        session.sendMessage(new TextMessage(payload));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID teamId = getTeamId(session);
        UUID userId = getUserId(session);
        String username = getUsername(session);

        try {
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String content = payload.get("content");

            if (content != null && !content.isBlank()) {
                teamChatService.processUserMessage(teamId, userId, username, content);
            }
        } catch (Exception e) {
            log.error("Error processing team chat message from {}", userId, e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        roomRegistry.leave(session);
    }

    private UUID getTeamId(WebSocketSession session) {
        return (UUID) session.getAttributes().get("teamId");
    }

    private UUID getUserId(WebSocketSession session) {
        return (UUID) session.getAttributes().get("userId");
    }

    private String getUsername(WebSocketSession session) {
        return (String) session.getAttributes().get("username");
    }
}

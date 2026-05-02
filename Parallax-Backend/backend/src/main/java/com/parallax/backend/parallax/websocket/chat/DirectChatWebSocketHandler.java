package com.parallax.backend.parallax.websocket.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parallax.backend.parallax.service.chat.DirectMessageService;
import com.parallax.backend.parallax.store.SessionRegistry;
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
public class DirectChatWebSocketHandler extends TextWebSocketHandler {

    private final DirectMessageService directMessageService;
    private final DirectChatRegistry registry;
    private final SessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = getUserId(session);
        String username = getUsername(session);

        registry.join(userId, session);
        sessionRegistry.registerWs(session.getId(), userId);
        log.info("用户 {} ({}) 连接了私信系统", username, userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID senderId = getUserId(session);
        String senderName = getUsername(session);

        try {
            // Expecting JSON: { "receiverId": "uuid", "content": "hello" }
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String receiverIdStr = payload.get("receiverId");
            String content = payload.get("content");

            if (receiverIdStr != null && content != null && !content.isBlank()) {
                UUID receiverId = UUID.fromString(receiverIdStr);
                directMessageService.sendDirectMessage(senderId, senderName, receiverId, content);
            }
        } catch (Exception e) {
            log.error("Error processing direct message from {}", senderId, e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        registry.leave(session);
        sessionRegistry.wsUserLeft(session.getId());
    }

    private UUID getUserId(WebSocketSession session) {
        return (UUID) session.getAttributes().get("userId");
    }

    private String getUsername(WebSocketSession session) {
        return (String) session.getAttributes().get("username");
    }
}

package com.parallax.backend.parallax.websocket.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parallax.backend.parallax.service.chat.DirectMessageService;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.UUID;

@Component
public class DirectChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(DirectChatWebSocketHandler.class);

    private final DirectMessageService directMessageService;
    private final DirectChatRegistry registry;
    private final SessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    public DirectChatWebSocketHandler(DirectMessageService directMessageService, DirectChatRegistry registry, SessionRegistry sessionRegistry, ObjectMapper objectMapper) {
        this.directMessageService = directMessageService;
        this.registry = registry;
        this.sessionRegistry = sessionRegistry;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = getUserId(session);
        String username = getUsername(session);

        registry.join(userId, session);
        sessionRegistry.registerWs(session.getId(), userId);
        log.info("User {} ({}) connected to DM system", username, userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID senderId = getUserId(session);
        String senderName = getUsername(session);

        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String receiverIdStr = (String) payload.get("receiverId");
            String content = (String) payload.get("content");

            if (receiverIdStr != null && content != null && !content.isBlank()) {
                UUID receiverId = UUID.fromString(receiverIdStr);
                directMessageService.sendDirectMessage(senderId, senderName, receiverId, content, null);
            } else if (payload.containsKey("reaction")) {
                UUID messageId = UUID.fromString((String) payload.get("messageId"));
                String emoji = (String) payload.get("emoji");
                directMessageService.toggleReaction(messageId, senderId, emoji);
            } else if (payload.containsKey("signal")) {
                UUID receiverId = UUID.fromString((String) payload.get("receiverId"));
                Object signalData = payload.get("data");
                
                Map<String, Object> signalMsg = new java.util.HashMap<>();
                signalMsg.put("type", "CALL_SIGNAL");
                signalMsg.put("senderId", senderId.toString());
                signalMsg.put("data", signalData);
                
                String signalPayload = objectMapper.writeValueAsString(signalMsg);
                registry.sendToUser(receiverId, new TextMessage(signalPayload));
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

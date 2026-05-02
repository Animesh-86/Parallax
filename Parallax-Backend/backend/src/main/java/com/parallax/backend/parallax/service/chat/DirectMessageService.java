package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.entity.chat.DirectMessage;
import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.repository.chat.DirectMessageRepository;
import com.parallax.backend.parallax.websocket.chat.DirectChatRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectMessageService {

    private final DirectMessageRepository directMessageRepository;
    private final DirectChatRegistry directChatRegistry;

    public void sendDirectMessage(UUID senderId, String senderName, UUID receiverId, String content) {
        // 1. Persist
        DirectMessage message = DirectMessage.builder()
                .senderId(senderId)
                .senderName(senderName)
                .receiverId(receiverId)
                .content(content)
                .type(MessageType.USER)
                .isRead(false)
                .build();
        directMessageRepository.save(message);

        // 2. Broadcast to both sender and receiver tabs
        directChatRegistry.broadcast(senderId, receiverId, message);
    }

    public List<DirectMessage> getChatHistory(UUID user1Id, UUID user2Id) {
        return directMessageRepository.findChatHistory(user1Id, user2Id);
    }
}

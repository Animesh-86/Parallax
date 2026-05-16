package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.entity.chat.DirectMessage;
import com.parallax.backend.parallax.entity.chat.MessageAttachment;
import com.parallax.backend.parallax.entity.chat.MessageReaction;
import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.repository.chat.DirectMessageRepository;
import com.parallax.backend.parallax.repository.chat.MessageReactionRepository;
import com.parallax.backend.parallax.websocket.chat.DirectChatRegistry;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectMessageService {

    private final DirectMessageRepository directMessageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final DirectChatRegistry directChatRegistry;

    public void sendDirectMessage(UUID senderId, String senderName, UUID receiverId, String content, List<MessageAttachment> attachments) {
        // 1. Persist
        DirectMessage message = DirectMessage.builder()
                .senderId(senderId)
                .senderName(senderName)
                .receiverId(receiverId)
                .content(content)
                .type(MessageType.USER)
                .isRead(false)
                .attachments(attachments != null ? attachments : new java.util.ArrayList<>())
                .build();
        directMessageRepository.save(message);

        // 2. Broadcast to both sender and receiver tabs
        directChatRegistry.broadcast(senderId, receiverId, message);
    }

    @Transactional
    public void toggleReaction(UUID messageId, UUID userId, String emojiCode) {
        DirectMessage message = directMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        var existing = messageReactionRepository.findByMessageIdAndUserIdAndEmojiCode(messageId, userId, emojiCode);

        if (existing.isPresent()) {
            messageReactionRepository.delete(existing.get());
            message.getReactions().removeIf(r -> r.getId().equals(existing.get().getId()));
        } else {
            MessageReaction reaction = MessageReaction.builder()
                    .messageId(messageId)
                    .userId(userId)
                    .emojiCode(emojiCode)
                    .build();
            messageReactionRepository.save(reaction);
            message.getReactions().add(reaction);
        }

        // Broadcast update
        directChatRegistry.broadcast(message.getSenderId(), message.getReceiverId(), message);
    }

    public List<DirectMessage> getChatHistory(UUID user1Id, UUID user2Id) {
        return directMessageRepository.findChatHistory(user1Id, user2Id);
    }
}

package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.entity.chat.DirectMessage;
import com.parallax.backend.parallax.entity.chat.MessageReaction;
import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.repository.chat.DirectMessageRepository;
import com.parallax.backend.parallax.repository.chat.MessageReactionRepository;
import com.parallax.backend.parallax.websocket.chat.DirectChatRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectMessageServiceTest {

    @Mock
    private DirectMessageRepository directMessageRepository;

    @Mock
    private MessageReactionRepository messageReactionRepository;

    @Mock
    private DirectChatRegistry directChatRegistry;

    @InjectMocks
    private DirectMessageService directMessageService;

    private UUID senderId;
    private UUID receiverId;
    private UUID messageId;

    @BeforeEach
    void setUp() {
        senderId = UUID.randomUUID();
        receiverId = UUID.randomUUID();
        messageId = UUID.randomUUID();
    }

    @Test
    void sendDirectMessage_Success() {
        directMessageService.sendDirectMessage(senderId, "Sender", receiverId, "Hi", null);

        ArgumentCaptor<DirectMessage> captor = ArgumentCaptor.forClass(DirectMessage.class);
        verify(directMessageRepository).save(captor.capture());

        DirectMessage saved = captor.getValue();
        assertEquals(senderId, saved.getSenderId());
        assertEquals("Sender", saved.getSenderName());
        assertEquals(receiverId, saved.getReceiverId());
        assertEquals("Hi", saved.getContent());
        assertEquals(MessageType.USER, saved.getType());
        assertFalse(saved.isRead());
        assertNotNull(saved.getAttachments());
        assertTrue(saved.getAttachments().isEmpty());

        verify(directChatRegistry).broadcast(eq(senderId), eq(receiverId), eq(saved));
    }

    @Test
    void toggleReaction_AddReaction_Success() {
        DirectMessage msg = DirectMessage.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .reactions(new ArrayList<>())
                .build();
        ReflectionTestUtils.setField(msg, "id", messageId);

        when(directMessageRepository.findById(messageId)).thenReturn(Optional.of(msg));
        when(messageReactionRepository.findByMessageIdAndUserIdAndEmojiCode(messageId, senderId, ":+1:"))
                .thenReturn(Optional.empty());

        directMessageService.toggleReaction(messageId, senderId, ":+1:");

        ArgumentCaptor<MessageReaction> captor = ArgumentCaptor.forClass(MessageReaction.class);
        verify(messageReactionRepository).save(captor.capture());
        assertEquals(":+1:", captor.getValue().getEmojiCode());
        assertEquals(senderId, captor.getValue().getUserId());

        assertEquals(1, msg.getReactions().size());
        verify(directChatRegistry).broadcast(eq(senderId), eq(receiverId), eq(msg));
    }

    @Test
    void toggleReaction_RemoveReaction_Success() {
        MessageReaction existingReaction = MessageReaction.builder()
                .messageId(messageId)
                .userId(senderId)
                .emojiCode(":+1:")
                .build();
        ReflectionTestUtils.setField(existingReaction, "id", UUID.randomUUID());

        List<MessageReaction> reactions = new ArrayList<>();
        reactions.add(existingReaction);

        DirectMessage msg = DirectMessage.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .reactions(reactions)
                .build();
        ReflectionTestUtils.setField(msg, "id", messageId);

        when(directMessageRepository.findById(messageId)).thenReturn(Optional.of(msg));
        when(messageReactionRepository.findByMessageIdAndUserIdAndEmojiCode(messageId, senderId, ":+1:"))
                .thenReturn(Optional.of(existingReaction));

        directMessageService.toggleReaction(messageId, senderId, ":+1:");

        verify(messageReactionRepository).delete(existingReaction);
        assertTrue(msg.getReactions().isEmpty());
        verify(directChatRegistry).broadcast(eq(senderId), eq(receiverId), eq(msg));
    }

    @Test
    void toggleReaction_MessageNotFound() {
        when(directMessageRepository.findById(messageId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> directMessageService.toggleReaction(messageId, senderId, ":+1:"));
        verify(messageReactionRepository, never()).save(any());
    }

    @Test
    void getChatHistory_Success() {
        DirectMessage msg = DirectMessage.builder().content("History").build();
        when(directMessageRepository.findChatHistory(senderId, receiverId)).thenReturn(Collections.singletonList(msg));

        List<DirectMessage> result = directMessageService.getChatHistory(senderId, receiverId);

        assertEquals(1, result.size());
        assertEquals("History", result.get(0).getContent());
        verify(directMessageRepository).findChatHistory(senderId, receiverId);
    }
}

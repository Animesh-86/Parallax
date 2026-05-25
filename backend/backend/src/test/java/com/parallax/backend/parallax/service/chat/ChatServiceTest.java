package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.entity.chat.ChatMessage;
import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.repository.chat.ChatRepository;
import com.parallax.backend.parallax.websocket.chat.ChatRoomRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private ChatRoomRegistry roomRegistry;

    @InjectMocks
    private ChatService chatService;

    private UUID projectId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void processUserMessage_Success() {
        chatService.processUserMessage(projectId, userId, "TestUser", "Hello World");

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatRepository).save(captor.capture());
        
        ChatMessage saved = captor.getValue();
        assertEquals(projectId, saved.getProjectId());
        assertEquals(userId, saved.getSenderId());
        assertEquals("TestUser", saved.getSenderName());
        assertEquals("Hello World", saved.getContent());
        assertEquals(MessageType.USER, saved.getType());

        verify(roomRegistry).broadcast(eq(projectId), eq(saved));
    }

    @Test
    void systemMessage_Success() {
        chatService.systemMessage(projectId, "System Notification");

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatRepository).save(captor.capture());
        
        ChatMessage saved = captor.getValue();
        assertEquals(projectId, saved.getProjectId());
        assertNull(saved.getSenderId());
        assertEquals("System", saved.getSenderName());
        assertEquals("System Notification", saved.getContent());
        assertEquals(MessageType.SYSTEM, saved.getType());

        verify(roomRegistry).broadcast(eq(projectId), eq(saved));
    }

    @Test
    void getRecentMessages_Success() {
        ChatMessage msg = ChatMessage.builder().content("test").build();
        when(chatRepository.findLatestByProject(eq(projectId), any(PageRequest.class)))
                .thenReturn(Collections.singletonList(msg));

        List<ChatMessage> result = chatService.getRecentMessages(projectId);

        assertEquals(1, result.size());
        assertEquals("test", result.get(0).getContent());
        verify(chatRepository).findLatestByProject(eq(projectId), any(PageRequest.class));
    }
}

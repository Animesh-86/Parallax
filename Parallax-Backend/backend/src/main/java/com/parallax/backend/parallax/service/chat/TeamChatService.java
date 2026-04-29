package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.entity.chat.TeamChatMessage;
import com.parallax.backend.parallax.repository.chat.TeamChatRepository;
import com.parallax.backend.parallax.websocket.chat.TeamChatRoomRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamChatService {

    private final TeamChatRepository teamChatRepository;
    private final TeamChatRoomRegistry roomRegistry;

    public void processUserMessage(UUID teamId, UUID userId, String username, String content) {
        TeamChatMessage message = TeamChatMessage.builder()
                .teamId(teamId)
                .senderId(userId)
                .senderName(username)
                .content(content)
                .type(MessageType.USER)
                .build();
        teamChatRepository.save(message);
        roomRegistry.broadcast(teamId, message);
    }

    public void systemMessage(UUID teamId, String content) {
        TeamChatMessage message = TeamChatMessage.builder()
                .teamId(teamId)
                .senderId(null)
                .senderName("System")
                .content(content)
                .type(MessageType.SYSTEM)
                .build();
        teamChatRepository.save(message);
        roomRegistry.broadcast(teamId, message);
    }

    public List<TeamChatMessage> getRecentMessages(UUID teamId) {
        return teamChatRepository.findLatestByTeam(teamId, PageRequest.of(0, 50));
    }
}

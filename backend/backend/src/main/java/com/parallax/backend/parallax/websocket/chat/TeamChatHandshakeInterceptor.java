package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.entity.team.TeamMemberStatus;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.team.TeamMemberRepository;
import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.websocket.BaseAuthHandshakeInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;

import java.util.Map;
import java.util.UUID;

@Component
public class TeamChatHandshakeInterceptor extends BaseAuthHandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TeamChatHandshakeInterceptor.class);

    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public TeamChatHandshakeInterceptor(JwtUtils jwtUtils, TeamMemberRepository teamMemberRepository, UserRepository userRepository) {
        super(jwtUtils);
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes,
                                UUID userId, String path) {

        UUID teamId = extractTeamId(path);
        if (teamId == null) {
            log.warn("Team chat handshake failed: No team ID in path {}", path);
            return false;
        }

        UUID channelId = extractChannelId(path);
        if (channelId == null) {
            log.warn("Team chat handshake failed: No channel ID in path {}", path);
            return false;
        }

        try {
            var membership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId);
            if (membership.isEmpty() || membership.get().getStatus() != TeamMemberStatus.ACTIVE) {
                log.warn("Team chat handshake failed: User {} not an active member of team {}", userId, teamId);
                return false;
            }

            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            attributes.put("teamId", teamId);
            attributes.put("channelId", channelId);
            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            log.error("Team chat authorization error", e);
            return false;
        }
    }

    private UUID extractTeamId(String path) {
        try {
            String[] parts = path.split("/");
            if (parts.length >= 4 && "team-chat".equals(parts[parts.length - 3])) {
                return UUID.fromString(parts[parts.length - 2]);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private UUID extractChannelId(String path) {
        try {
            String[] parts = path.split("/");
            if (parts.length >= 4 && "team-chat".equals(parts[parts.length - 3])) {
                return UUID.fromString(parts[parts.length - 1]);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}

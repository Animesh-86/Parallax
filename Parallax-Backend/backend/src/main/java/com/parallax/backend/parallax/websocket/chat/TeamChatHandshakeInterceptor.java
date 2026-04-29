package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.entity.team.TeamMemberStatus;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.team.TeamMemberRepository;
import com.parallax.backend.parallax.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamChatHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        URI uri = request.getURI();
        String path = uri.getPath();
        String query = uri.getQuery();

        UUID teamId = extractTeamId(path);
        if (teamId == null) {
            log.warn("Team chat handshake failed: No team ID in path {}", path);
            return false;
        }

        String token = extractToken(query);
        if (token == null) {
            log.warn("Team chat handshake failed: No token provided");
            return false;
        }

        try {
            if (!jwtUtils.validate(token)) {
                log.warn("Team chat handshake failed: Invalid token");
                return false;
            }

            UUID userId = jwtUtils.getUserIdFromToken(token);

            // Verify team membership
            var membership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId);
            if (membership.isEmpty() || membership.get().getStatus() != TeamMemberStatus.ACTIVE) {
                log.warn("Team chat handshake failed: User {} not an active member of team {}", userId, teamId);
                return false;
            }

            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            attributes.put("teamId", teamId);
            attributes.put("userId", userId);
            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            log.error("Team chat handshake error", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
    }

    private UUID extractTeamId(String path) {
        try {
            // Expected: /ws/team-chat/<UUID>
            String[] parts = path.split("/");
            if (parts.length >= 4 && "team-chat".equals(parts[2])) {
                return UUID.fromString(parts[parts.length - 1]);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private String extractToken(String query) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length == 2 && "token".equals(pair[0])) {
                return pair[1];
            }
        }
        return null;
    }
}

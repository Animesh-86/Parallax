package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Component
public class ChatHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ChatHandshakeInterceptor.class);

    private final JwtUtils jwtUtils;
    private final ProjectAccessManager accessManager;
    private final UserRepository userRepository;

    public ChatHandshakeInterceptor(JwtUtils jwtUtils, ProjectAccessManager accessManager, UserRepository userRepository) {
        this.jwtUtils = jwtUtils;
        this.accessManager = accessManager;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        URI uri = request.getURI();
        String path = uri.getPath();
        String query = uri.getQuery();

        UUID projectId = extractProjectId(path);
        if (projectId == null) {
            log.warn("Chat handshake failed: No project ID in path {}", path);
            return false;
        }

        String token = extractToken(query);
        if (token == null) {
            log.warn("Chat handshake failed: No token provided");
            return false;
        }

        try {
            if (!jwtUtils.validate(token)) {
                log.warn("Chat handshake failed: Invalid token");
                return false;
            }

            UUID userId = jwtUtils.getUserIdFromToken(token);
            accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);

            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            attributes.put("projectId", projectId);
            attributes.put("userId", userId);
            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            log.error("Chat handshake error", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
    }

    private UUID extractProjectId(String path) {
        try {
            String[] parts = path.split("/");
            if (parts.length >= 4 && "chat".equals(parts[2])) {
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

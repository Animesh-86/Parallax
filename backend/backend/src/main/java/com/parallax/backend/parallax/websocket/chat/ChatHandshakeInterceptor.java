package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.repository.UserRepository;
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
public class ChatHandshakeInterceptor extends BaseAuthHandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ChatHandshakeInterceptor.class);

    private final ProjectAccessManager accessManager;
    private final UserRepository userRepository;

    public ChatHandshakeInterceptor(JwtUtils jwtUtils, ProjectAccessManager accessManager, UserRepository userRepository) {
        super(jwtUtils);
        this.accessManager = accessManager;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes,
                                UUID userId, String path) {

        UUID projectId = extractProjectId(path);
        if (projectId == null) {
            log.warn("Chat handshake failed: No project ID in path {}", path);
            return false;
        }

        try {
            accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);

            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            attributes.put("projectId", projectId);
            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            log.error("Chat authorization failed", e);
            return false;
        }
    }

    private UUID extractProjectId(String path) {
        try {
            String[] parts = path.split("/");
            if (parts.length >= 3 && "chat".equals(parts[parts.length - 2])) {
                return UUID.fromString(parts[parts.length - 1]);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}

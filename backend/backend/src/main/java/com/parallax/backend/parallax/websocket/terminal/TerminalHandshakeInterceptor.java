package com.parallax.backend.parallax.websocket.terminal;

import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
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
public class TerminalHandshakeInterceptor extends BaseAuthHandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TerminalHandshakeInterceptor.class);

    private final ProjectAccessManager accessManager;

    public TerminalHandshakeInterceptor(JwtUtils jwtUtils, ProjectAccessManager accessManager) {
        super(jwtUtils);
        this.accessManager = accessManager;
    }

    @Override
    protected boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes,
                                UUID userId, String path) {

        UUID projectId = extractProjectId(path);
        if (projectId == null) {
            log.warn("Terminal handshake failed: No project ID in path {}", path);
            return false;
        }

        try {
            // Require EXECUTE_CODE permission for terminal access (Critical Security Fix)
            accessManager.require(projectId, userId, ProjectPermission.EXECUTE_CODE);

            attributes.put("projectId", projectId);

            return true;
        } catch (Exception e) {
            log.error("Terminal handshake error", e);
            return false;
        }
    }

    private UUID extractProjectId(String path) {
        try {
            String[] parts = path.split("/");
            if (parts.length >= 3 && "terminal".equals(parts[parts.length - 2])) {
                return UUID.fromString(parts[parts.length - 1]);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}

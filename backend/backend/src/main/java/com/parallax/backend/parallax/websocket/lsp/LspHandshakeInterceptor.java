package com.parallax.backend.parallax.websocket.lsp;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class LspHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(LspHandshakeInterceptor.class);

    private final JwtUtils jwtUtils;
    private final ProjectAccessManager accessManager;
    private final ProjectRepository projectRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        URI uri = request.getURI();
        String path = uri.getPath();
        String query = uri.getQuery();

        String[] segments = path.split("/");
        
        if (segments.length < 3) {
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            return false;
        }
        
        String projectIdStr = segments[segments.length - 2];

        String token = extractToken(query);
        if (token == null) {
            log.warn("LSP handshake failed: No token provided");
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            if (!jwtUtils.validate(token)) {
                log.warn("LSP handshake failed: Invalid token");
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            UUID userId = jwtUtils.getUserIdFromToken(token);
            UUID projectId = UUID.fromString(projectIdStr);
            
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) {
                response.setStatusCode(HttpStatus.NOT_FOUND);
                return false;
            }

            // LSP requires READ_FILE
            accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
            
            attributes.put("userId", userId);
            attributes.put("projectId", projectId);
            return true;

        } catch (Exception e) {
            log.error("LSP handshake error", e);
            response.setStatusCode(HttpStatus.FORBIDDEN);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
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

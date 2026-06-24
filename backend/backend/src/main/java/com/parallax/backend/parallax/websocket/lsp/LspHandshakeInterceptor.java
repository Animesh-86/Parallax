package com.parallax.backend.parallax.websocket.lsp;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.websocket.BaseAuthHandshakeInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;

import java.util.Map;
import java.util.UUID;

@Component
public class LspHandshakeInterceptor extends BaseAuthHandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(LspHandshakeInterceptor.class);

    private final ProjectAccessManager accessManager;
    private final ProjectRepository projectRepository;

    public LspHandshakeInterceptor(JwtUtils jwtUtils, ProjectAccessManager accessManager, ProjectRepository projectRepository) {
        super(jwtUtils);
        this.accessManager = accessManager;
        this.projectRepository = projectRepository;
    }

    @Override
    protected boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes,
                                UUID userId, String path) {

        String[] segments = path.split("/");
        
        if (segments.length < 3) {
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            return false;
        }
        
        String projectIdStr = segments[segments.length - 2];

        try {
            UUID projectId = UUID.fromString(projectIdStr);
            
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) {
                response.setStatusCode(HttpStatus.NOT_FOUND);
                return false;
            }

            // LSP requires READ_FILE
            accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
            
            attributes.put("projectId", projectId);
            return true;

        } catch (Exception e) {
            log.error("LSP handshake error", e);
            response.setStatusCode(HttpStatus.FORBIDDEN);
            return false;
        }
    }
}

package com.parallax.backend.parallax.websocket;

import com.parallax.backend.parallax.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

public abstract class BaseAuthHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(BaseAuthHandshakeInterceptor.class);

    protected final JwtUtils jwtUtils;

    public BaseAuthHandshakeInterceptor(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        URI uri = request.getURI();
        String path = uri.getPath();
        String query = uri.getQuery();

        String token = extractToken(query);
        if (token == null) {
            log.warn("Handshake failed: No token provided in path {}", path);
            return false;
        }

        try {
            if (!jwtUtils.validate(token)) {
                log.warn("Handshake failed: Invalid token");
                return false;
            }

            UUID userId = jwtUtils.getUserIdFromToken(token);
            attributes.put("userId", userId);
            
            return authorize(request, response, wsHandler, attributes, userId, path);
        } catch (Exception e) {
            log.error("Handshake error", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }

    protected abstract boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                         WebSocketHandler wsHandler, Map<String, Object> attributes,
                                         UUID userId, String path);

    protected String extractToken(String query) {
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

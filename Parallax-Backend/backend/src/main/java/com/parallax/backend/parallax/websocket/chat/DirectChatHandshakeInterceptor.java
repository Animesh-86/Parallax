package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.repository.UserRepository;
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
public class DirectChatHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        URI uri = request.getURI();
        String query = uri.getQuery();

        // Extract Token
        String token = extractToken(query);
        if (token == null) {
            log.warn("Direct Chat handshake failed: No token provided");
            return false;
        }

        try {
            // Validate Token
            if (!jwtUtils.validate(token)) {
                log.warn("Direct Chat handshake failed: Invalid token");
                return false;
            }

            UUID userId = jwtUtils.getUserIdFromToken(token);

            // Fetch Username
            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            // Store attributes for the session
            attributes.put("userId", userId);
            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            log.error("Direct Chat handshake error", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }

    private String extractToken(String query) {
        if (query == null)
            return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length == 2 && "token".equals(pair[0])) {
                return pair[1];
            }
        }
        return null;
    }
}

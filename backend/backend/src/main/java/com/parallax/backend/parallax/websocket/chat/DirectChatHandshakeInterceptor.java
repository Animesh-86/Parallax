package com.parallax.backend.parallax.websocket.chat;

import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.websocket.BaseAuthHandshakeInterceptor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;

import java.util.Map;
import java.util.UUID;

@Component
public class DirectChatHandshakeInterceptor extends BaseAuthHandshakeInterceptor {

    private final UserRepository userRepository;

    public DirectChatHandshakeInterceptor(JwtUtils jwtUtils, UserRepository userRepository) {
        super(jwtUtils);
        this.userRepository = userRepository;
    }

    @Override
    protected boolean authorize(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes,
                                UUID userId, String path) {
        try {
            String username = userRepository.findById(userId)
                    .map(u -> u.getFullName())
                    .orElse("Unknown");

            attributes.put("username", username);

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

package com.parallax.backend.parallax.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketPermissionInterceptor permissionInterceptor;

    public WebSocketConfig(WebSocketPermissionInterceptor permissionInterceptor) {
        this.permissionInterceptor = permissionInterceptor;
    }

    // MESSAGE BROKER
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler te = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
        te.setPoolSize(1);
        te.setThreadNamePrefix("wss-heartbeat-thread-");
        te.initialize();

        // Simple in-memory broker (OK for now)
        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[] { 10000, 10000 }) // Heartbeat every 10s
                .setTaskScheduler(te);

        // All client SEND must go through /app
        config.setApplicationDestinationPrefixes("/app");
    }

    // STOMP ENDPOINT
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                // 🔐 Restrict origins (match your frontend)
                .setAllowedOriginPatterns(
                        "http://localhost:3000")
                // Enable SockJS fallback
                .withSockJS();
    }

    // INBOUND SECURITY
    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration) {
        registration.interceptors(permissionInterceptor);
    }

    @org.springframework.web.socket.config.annotation.EnableWebSocket
    @Configuration
    static class RawWebSocketConfig implements org.springframework.web.socket.config.annotation.WebSocketConfigurer {

        private final com.parallax.backend.parallax.websocket.chat.ChatWebSocketHandler chatHandler;
        private final com.parallax.backend.parallax.websocket.chat.ChatHandshakeInterceptor chatInterceptor;
        private final com.parallax.backend.parallax.websocket.chat.TeamChatWebSocketHandler teamChatHandler;
        private final com.parallax.backend.parallax.websocket.chat.TeamChatHandshakeInterceptor teamChatInterceptor;
        private final com.parallax.backend.parallax.websocket.chat.DirectChatWebSocketHandler directChatHandler;
        private final com.parallax.backend.parallax.websocket.chat.DirectChatHandshakeInterceptor directChatInterceptor;

        RawWebSocketConfig(com.parallax.backend.parallax.websocket.chat.ChatWebSocketHandler chatHandler,
                com.parallax.backend.parallax.websocket.chat.ChatHandshakeInterceptor chatInterceptor,
                com.parallax.backend.parallax.websocket.chat.TeamChatWebSocketHandler teamChatHandler,
                com.parallax.backend.parallax.websocket.chat.TeamChatHandshakeInterceptor teamChatInterceptor,
                com.parallax.backend.parallax.websocket.chat.DirectChatWebSocketHandler directChatHandler,
                com.parallax.backend.parallax.websocket.chat.DirectChatHandshakeInterceptor directChatInterceptor) {
            this.chatHandler = chatHandler;
            this.chatInterceptor = chatInterceptor;
            this.teamChatHandler = teamChatHandler;
            this.teamChatInterceptor = teamChatInterceptor;
            this.directChatHandler = directChatHandler;
            this.directChatInterceptor = directChatInterceptor;
        }

        @Override
        public void registerWebSocketHandlers(
                org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry registry) {
            registry.addHandler(chatHandler, "/ws/chat/{projectId}")
                    .addInterceptors(chatInterceptor)
                    .setAllowedOriginPatterns("*");

            registry.addHandler(teamChatHandler, "/ws/team-chat/{teamId}")
                    .addInterceptors(teamChatInterceptor)
                    .setAllowedOriginPatterns("*");
                    
            registry.addHandler(directChatHandler, "/ws/direct-chat")
                    .addInterceptors(directChatInterceptor)
                    .setAllowedOriginPatterns("*");
        }
    }
}

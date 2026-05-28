package com.parallax.backend.parallax.websocket.terminal;

import com.parallax.backend.parallax.store.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TerminalWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TerminalWebSocketHandler.class);

    private final SessionRegistry sessionRegistry;

    // Track active terminal processes and their output streams
    private final Map<String, Process> processMap = new ConcurrentHashMap<>();
    private final Map<String, OutputStream> outputStreamMap = new ConcurrentHashMap<>();

    public TerminalWebSocketHandler(SessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String uri = session.getUri().toString();
        // Expected URI: /ws/terminal/{projectId}
        String projectIdStr = extractProjectId(uri);

        if (projectIdStr == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Missing project ID"));
            return;
        }

        UUID projectId;
        try {
            projectId = UUID.fromString(projectIdStr);
        } catch (IllegalArgumentException e) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid project ID"));
            return;
        }

        // Get container name for project
        String containerName = sessionRegistry.getSessionIdForProject(projectId)
                .map(sessionId -> sessionRegistry.getBySessionId(sessionId))
                .map(SessionRegistry.SessionInfo::getContainerName)
                .orElse(null);

        if (containerName == null) {
            session.sendMessage(new TextMessage("Error: No active session for this project.\r\n"));
            session.close(CloseStatus.SERVER_ERROR);
            return;
        }

        try {
            // Start docker exec process attached to container
            // We use -i for interactive stdin, but without -t since ProcessBuilder doesn't provide a true PTY
            ProcessBuilder pb = new ProcessBuilder("docker", "exec", "-i", containerName, "/bin/sh");
            Process process = pb.start();

            processMap.put(session.getId(), process);
            outputStreamMap.put(session.getId(), process.getOutputStream());

            // Read output and send to websocket
            Thread readerThread = new Thread(() -> {
                try (InputStream is = process.getInputStream()) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        if (session.isOpen()) {
                            // Ensure data is sent as text message since xterm expects strings or we can send binary
                            session.sendMessage(new TextMessage(new String(buffer, 0, len)));
                        }
                    }
                } catch (Exception e) {
                    log.error("Error reading from docker process", e);
                } finally {
                    try {
                        if (session.isOpen()) {
                            session.close();
                        }
                    } catch (Exception ignored) {}
                }
            });
            readerThread.start();

            // Read error stream
            Thread errorReaderThread = new Thread(() -> {
                try (InputStream is = process.getErrorStream()) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        if (session.isOpen()) {
                            session.sendMessage(new TextMessage(new String(buffer, 0, len)));
                        }
                    }
                } catch (Exception e) {
                    log.error("Error reading stderr from docker process", e);
                }
            });
            errorReaderThread.start();

        } catch (Exception e) {
            log.error("Failed to start terminal process", e);
            session.sendMessage(new TextMessage("Error: Failed to attach terminal.\r\n"));
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        OutputStream os = outputStreamMap.get(session.getId());
        if (os != null) {
            os.write(message.getPayload().getBytes());
            os.flush();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Process process = processMap.remove(session.getId());
        if (process != null) {
            process.destroy();
        }
        outputStreamMap.remove(session.getId());
    }

    private String extractProjectId(String uri) {
        try {
            String path = java.net.URI.create(uri).getPath();
            String[] segments = path.split("/");
            return segments[segments.length - 1];
        } catch (Exception e) {
            return null;
        }
    }
}

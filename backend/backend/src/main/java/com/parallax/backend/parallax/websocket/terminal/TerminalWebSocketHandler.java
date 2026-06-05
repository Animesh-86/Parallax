package com.parallax.backend.parallax.websocket.terminal;

import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.core.DockerClientBuilder;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class TerminalWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TerminalWebSocketHandler.class);

    private final SessionRegistry sessionRegistry;
    private final DockerClient dockerClient;
    private final ProjectAccessManager accessManager;

    // Track output streams connected to docker stdin
    private final Map<String, PipedOutputStream> outputStreamMap = new ConcurrentHashMap<>();

    // Scheduler for periodic re-authorization checks
    private final java.util.concurrent.ScheduledExecutorService scheduler = 
            java.util.concurrent.Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "terminal-reauth-scheduler");
                t.setDaemon(true);
                return t;
            });

    private final Map<String, java.util.concurrent.ScheduledFuture<?>> reauthTasks = new ConcurrentHashMap<>();

    public TerminalWebSocketHandler(SessionRegistry sessionRegistry, DockerClient dockerClient, ProjectAccessManager accessManager) {
        this.sessionRegistry = sessionRegistry;
        this.dockerClient = dockerClient;
        this.accessManager = accessManager;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String uri = session.getUri().toString();
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

        UUID sessionProjectId = (UUID) session.getAttributes().get("projectId");
        UUID sessionUserId = (UUID) session.getAttributes().get("userId");
        if (sessionProjectId == null || sessionUserId == null || !sessionProjectId.equals(projectId)) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Unauthorized project access"));
            return;
        }

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
            // 1. Create Exec Command with True PTY
            ExecCreateCmdResponse execResponse = dockerClient.execCreateCmd(containerName)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withAttachStdin(true)
                    .withTty(true) // TRUE PTY!
                    .withCmd("/bin/bash")
                    .withEnv(java.util.Arrays.asList("TERM=xterm"))
                    .exec();

            // 2. Setup Stdin Pipe
            PipedInputStream in = new PipedInputStream(8192);
            PipedOutputStream out = new PipedOutputStream(in);
            outputStreamMap.put(session.getId(), out);

            // 3. Start Exec Command and pipe output to WebSocket
            dockerClient.execStartCmd(execResponse.getId())
                    .withTty(true)
                    .withStdIn(in)
                    .exec(new ExecStartResultCallback() {
                        @Override
                        public void onNext(Frame item) {
                            try {
                                if (session.isOpen()) {
                                    session.sendMessage(new TextMessage(item.getPayload()));
                                }
                            } catch (Exception e) {
                                log.error("Error sending terminal output to websocket", e);
                            }
                            super.onNext(item);
                        }

                        @Override
                        public void onComplete() {
                            try {
                                if (session.isOpen()) {
                                    session.close();
                                }
                            } catch (Exception ignored) {}
                            super.onComplete();
                        }
                    });

            // 4. Setup periodic permission checks
            java.util.concurrent.ScheduledFuture<?> task = scheduler.scheduleAtFixedRate(() -> {
                try {
                    if (session.isOpen()) {
                        accessManager.require(projectId, sessionUserId, ProjectPermission.EXECUTE_CODE);
                    } else {
                        cancelReauthTask(session.getId());
                    }
                } catch (Exception e) {
                    log.warn("Permission check failed for terminal session {}, closing", session.getId(), e);
                    cancelReauthTask(session.getId());
                    try {
                        session.close(CloseStatus.POLICY_VIOLATION.withReason("Access revoked"));
                    } catch (Exception ignored) {}
                }
            }, 10, 10, TimeUnit.SECONDS);
            reauthTasks.put(session.getId(), task);

        } catch (Exception e) {
            log.error("Failed to start terminal process", e);
            session.sendMessage(new TextMessage("Error: Failed to attach terminal.\r\n"));
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID projectId = (UUID) session.getAttributes().get("projectId");
        UUID userId = (UUID) session.getAttributes().get("userId");
        if (projectId == null || userId == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Unauthorized session"));
            return;
        }

        try {
            accessManager.require(projectId, userId, ProjectPermission.EXECUTE_CODE);
        } catch (Exception e) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Access revoked"));
            return;
        }

        PipedOutputStream os = outputStreamMap.get(session.getId());
        if (os != null) {
            os.write(message.getPayload().getBytes());
            os.flush();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        cancelReauthTask(session.getId());
        PipedOutputStream os = outputStreamMap.remove(session.getId());
        if (os != null) {
            try {
                os.close();
            } catch (Exception ignored) {}
        }
    }

    private void cancelReauthTask(String sessionId) {
        java.util.concurrent.ScheduledFuture<?> task = reauthTasks.remove(sessionId);
        if (task != null) {
            task.cancel(true);
        }
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

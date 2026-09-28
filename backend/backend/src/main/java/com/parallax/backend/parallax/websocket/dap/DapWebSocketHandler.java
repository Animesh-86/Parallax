package com.parallax.backend.parallax.websocket.dap;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.async.ResultCallbackTemplate;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.StreamType;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
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

@Component
@RequiredArgsConstructor
public class DapWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(DapWebSocketHandler.class);
    private final SessionRegistry sessionRegistry;
    private final DockerClient dockerClient;

    private final Map<String, PipedOutputStream> outputStreamMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionExecIdMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String uri = session.getUri() != null ? session.getUri().getPath() : "";
        String[] pathSegments = uri.split("/");
        
        // Expected URI: /ws/dap/{projectId}/{language}
        if (pathSegments.length < 3) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid URI"));
            return;
        }
        
        String language = pathSegments[pathSegments.length - 1];
        String projectIdStr = pathSegments[pathSegments.length - 2];
        
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
            session.close(CloseStatus.SERVER_ERROR.withReason("No active session"));
            return;
        }

        String[] dapCommand = getDapCommand(language);
        if (dapCommand == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Debugging not supported for language: " + language));
            return;
        }

        try {
            log.info("Starting DAP adapter command inside container {}: {}", containerName, String.join(" ", dapCommand));

            // DAP runs with coder user privileges (1000:1000) so the debugged script
            // can run with normal user permissions.
            ExecCreateCmdResponse execResponse = dockerClient.execCreateCmd(containerName)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withAttachStdin(true)
                    .withTty(false)
                    .withUser("1000:1000") // coder user
                    .withCmd(dapCommand)
                    .withEnv(java.util.Arrays.asList(
                            "TERM=xterm",
                            "HOME=/home/runner"
                    ))
                    .exec();

            PipedInputStream in = new PipedInputStream(8192);
            PipedOutputStream out = new PipedOutputStream(in);
            outputStreamMap.put(session.getId(), out);
            sessionExecIdMap.put(session.getId(), execResponse.getId());

            dockerClient.execStartCmd(execResponse.getId())
                    .withStdIn(in)
                    .exec(new ResultCallbackTemplate<ResultCallbackTemplate<?, Frame>, Frame>() {
                        @Override
                        public void onNext(Frame item) {
                            try {
                                if (session.isOpen() && (item.getStreamType() == StreamType.STDOUT || item.getStreamType() == StreamType.STDERR)) {
                                    session.sendMessage(new TextMessage(item.getPayload()));
                                }
                            } catch (Exception e) {
                                log.error("Error sending DAP output to websocket", e);
                            }
                        }

                        @Override
                        public void onComplete() {
                            try {
                                if (session.isOpen()) {
                                    session.close();
                                }
                            } catch (Exception e) {
                                log.error("Error reading from DAP output stream", e);
                            }
                            super.onComplete();
                        }
                    });

        } catch (Exception e) {
            log.error("Failed to start DAP process", e);
            session.close(CloseStatus.SERVER_ERROR.withReason("Failed to start DAP"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        PipedOutputStream os = outputStreamMap.get(session.getId());
        if (os != null) {
            os.write(message.getPayload().getBytes());
            os.flush();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        PipedOutputStream os = outputStreamMap.remove(session.getId());
        if (os != null) {
            try {
                os.close();
            } catch (Exception e) {
                log.error("Error closing DAP stdin stream", e);
            }
        }
        sessionExecIdMap.remove(session.getId());
    }

    private String[] getDapCommand(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> new String[]{"python3", "-m", "debugpy.adapter"};
            default -> null; // Other languages can be added here
        };
    }
}

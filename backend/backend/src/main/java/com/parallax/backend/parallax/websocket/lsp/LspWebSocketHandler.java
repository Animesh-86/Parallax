package com.parallax.backend.parallax.websocket.lsp;

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
public class LspWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(LspWebSocketHandler.class);
    private final SessionRegistry sessionRegistry;
    private final DockerClient dockerClient;

    private final Map<String, PipedOutputStream> outputStreamMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionExecIdMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String uri = session.getUri() != null ? session.getUri().toString() : "";
        String[] pathSegments = uri.split("/");
        
        // Expected URI: /ws/lsp/{projectId}/{language}
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

        String containerName = sessionRegistry.getSessionIdForProject(projectId)
                .map(sessionId -> sessionRegistry.getBySessionId(sessionId))
                .map(SessionRegistry.SessionInfo::getContainerName)
                .orElse(null);

        if (containerName == null) {
            session.close(CloseStatus.SERVER_ERROR.withReason("No active session"));
            return;
        }

        String[] lspCommand = getLspCommand(language);

        try {
            ExecCreateCmdResponse execResponse = dockerClient.execCreateCmd(containerName)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withAttachStdin(true)
                    .withTty(false)
                    .withCmd(lspCommand)
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
                                if (session.isOpen() && item.getStreamType() == StreamType.STDOUT) {
                                    session.sendMessage(new TextMessage(item.getPayload()));
                                }
                            } catch (Exception e) {
                                log.error("Error sending LSP output to websocket", e);
                            }
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

        } catch (Exception e) {
            log.error("Failed to start LSP process", e);
            session.close(CloseStatus.SERVER_ERROR.withReason("Failed to start LSP"));
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
            } catch (Exception ignored) {}
        }
        sessionExecIdMap.remove(session.getId());
    }

    private String[] getLspCommand(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> new String[]{"pylsp"};
            case "javascript", "typescript", "typescriptreact", "javascriptreact" -> new String[]{"typescript-language-server", "--stdio"};
            case "java" -> new String[]{"jdtls", "-data", "/workspace/.metadata"};
            case "c", "cpp" -> new String[]{"clangd"};
            default -> new String[]{"typescript-language-server", "--stdio"};
        };
    }
}

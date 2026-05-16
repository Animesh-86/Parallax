package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.CommandResult;
import com.parallax.backend.parallax.dto.execution.RunCodeBroadcastMessage;
import com.parallax.backend.parallax.dto.execution.RunCodeRequestWS;
import com.parallax.backend.parallax.exception.ForbiddenException;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.session.SessionFacade;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final RunCodeService runCodeService;
    private final SessionFacade sessionFacade;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProjectAccessManager accessManager;

    public void run(UUID projectId, RunCodeRequestWS msg, UUID userId) {

        // 🔐 AUTHORIZE EARLY
        try {
            accessManager.require(
                    projectId,
                    userId,
                    ProjectPermission.EXECUTE_CODE
            );
        } catch (ForbiddenException e) {
            send(projectId, new RunCodeBroadcastMessage(
                    null,
                    "RUN_ERROR",
                    "Not authorized to execute code",
                    -1,
                    userId.toString()
            ));
            return;
        }

        SessionRegistry.SessionInfo session =
                sessionFacade.getSessionByProject(projectId);

        if (session == null) {
            send(projectId, new RunCodeBroadcastMessage(
                    null,
                    "RUN_ERROR",
                    "No active session. Start session first.",
                    -1,
                    userId.toString()
            ));
            return;
        }

        String defaultFilename = switch (session.getLanguage().toLowerCase()) {
            case "python" -> "main.py";
            case "java" -> "Main.java";
            case "javascript" -> "index.js";
            case "c" -> "main.c";
            case "cpp" -> "main.cpp";
            default -> "main.py";
        };

        String filename =
                (msg.getFilename() == null || msg.getFilename().isBlank())
                        ? defaultFilename
                        : msg.getFilename();

        // 🔥 RUN STARTED (single authoritative signal)
        send(projectId, new RunCodeBroadcastMessage(
                session.getSessionId(),
                "RUN_STARTED",
                null,
                null,
                userId.toString()
        ));

        try {
            CommandResult result =
                    runCodeService.runCodeInSession(
                            session.getSessionId(),
                            filename,
                            msg.getTimeoutSeconds(),
                            userId,
                            line -> send(
                                    projectId,
                                    new RunCodeBroadcastMessage(
                                            session.getSessionId(),
                                            "RUN_OUTPUT",
                                            line,
                                            null,
                                            userId.toString()
                                    )
                            )
                    );

            //  RUN FINISHED
            send(projectId, new RunCodeBroadcastMessage(
                    session.getSessionId(),
                    "RUN_FINISHED",
                    null,
                    result.getExitCode(),
                    userId.toString()
            ));

        } catch (Exception ex) {
            send(projectId, new RunCodeBroadcastMessage(
                    session.getSessionId(),
                    "RUN_ERROR",
                    ex.getMessage() != null
                            ? ex.getMessage()
                            : "Execution failed",
                    -1,
                    userId.toString()
            ));
        }
    }

    private void send(UUID projectId, RunCodeBroadcastMessage payload) {
        messagingTemplate.convertAndSend(
                "/topic/projects/" + projectId + "/run-output",
                payload
        );
    }
}

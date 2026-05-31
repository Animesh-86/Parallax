package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.CommandResult;
import com.parallax.backend.parallax.dto.execution.RunCodeBroadcastMessage;
import com.parallax.backend.parallax.dto.execution.RunCodeRequestWS;
import com.parallax.backend.parallax.exception.ForbiddenException;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.session.SessionFacade;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeExecutionServiceTest {

    @Mock
    private RunCodeService runCodeService;
    @Mock
    private SessionFacade sessionFacade;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private ProjectAccessManager accessManager;

    @InjectMocks
    private CodeExecutionService executionService;

    private UUID projectId;
    private UUID userId;
    private RunCodeRequestWS request;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        request = new RunCodeRequestWS();
        request.setFilename("main.py");
        request.setTimeoutSeconds(10);
    }

    @Test
    void run_NotAuthorized_BroadcastsError() {
        doThrow(new ForbiddenException("Denied"))
                .when(accessManager).require(projectId, userId, ProjectPermission.EXECUTE_CODE);

        executionService.run(projectId, request, userId);

        ArgumentCaptor<RunCodeBroadcastMessage> captor = ArgumentCaptor.forClass(RunCodeBroadcastMessage.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/projects/" + projectId + "/run-output"), captor.capture());
        assertEquals("RUN_ERROR", captor.getValue().getType());
        verify(sessionFacade, never()).getSessionByProject(any());
    }

    @Test
    void run_NoSession_BroadcastsError() {
        doNothing().when(accessManager).require(projectId, userId, ProjectPermission.EXECUTE_CODE);
        when(sessionFacade.getSessionByProject(projectId)).thenReturn(null);

        executionService.run(projectId, request, userId);

        ArgumentCaptor<RunCodeBroadcastMessage> captor = ArgumentCaptor.forClass(RunCodeBroadcastMessage.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/projects/" + projectId + "/run-output"), captor.capture());
        assertEquals("RUN_ERROR", captor.getValue().getType());
        assertEquals("No active session. Start session first.", captor.getValue().getOutput());
    }

    @Test
    void run_Success_BroadcastsStartedAndFinished() throws Exception {
        doNothing().when(accessManager).require(projectId, userId, ProjectPermission.EXECUTE_CODE);
        
        SessionRegistry.SessionInfo sessionInfo = new SessionRegistry.SessionInfo(
                "sess-123", "container", projectId, userId, "python", null
        );
        when(sessionFacade.getSessionByProject(projectId)).thenReturn(sessionInfo);

        CommandResult result = new CommandResult(0, "");
        when(runCodeService.runCodeInSession(eq("sess-123"), eq("main.py"), eq(10), eq(userId), any()))
                .thenReturn(result);

        executionService.run(projectId, request, userId);

        ArgumentCaptor<RunCodeBroadcastMessage> captor = ArgumentCaptor.forClass(RunCodeBroadcastMessage.class);
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/projects/" + projectId + "/run-output"), captor.capture());

        assertEquals("RUN_STARTED", captor.getAllValues().get(0).getType());
        assertEquals("RUN_FINISHED", captor.getAllValues().get(1).getType());
        assertEquals(0, captor.getAllValues().get(1).getExitCode());
    }
}

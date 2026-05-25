package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.CommandResult;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.service.file.FileSyncService;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RunCodeServiceTest {

    @Mock
    private SessionRegistry sessionRegistry;
    @Mock
    private ProjectAccessManager accessManager;
    @Mock
    private FileSyncService fileSyncService;
    @Mock
    private ProjectFileRepository fileRepo;
    @Mock
    private RunRateLimiter runRateLimiter;
    @Mock
    private ExecutionLockService executionLockService;
    @Mock
    private ExecutionCoordinator executionCoordinator;

    @InjectMocks
    private RunCodeService runCodeService;

    private UUID projectId;
    private UUID userId;
    private String sessionId;
    private SessionRegistry.SessionInfo sessionInfo;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sessionId = "sess-123";
        sessionInfo = new SessionRegistry.SessionInfo(sessionId, "container-1", projectId, userId, "python");
    }

    @Test
    void runCodeInSession_SessionNotFound_ThrowsException() {
        when(sessionRegistry.getBySessionId(sessionId)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, 
                () -> runCodeService.runCodeInSession(sessionId, "main.py", 10, userId, msg -> {}));
    }

    @Test
    void runCodeInSession_RateLimitExceeded_ReturnsErrorResult() throws Exception {
        when(sessionRegistry.getBySessionId(sessionId)).thenReturn(sessionInfo);
        when(runRateLimiter.allow(projectId)).thenReturn(false);

        CommandResult result = runCodeService.runCodeInSession(sessionId, "main.py", 10, userId, msg -> {});

        assertEquals(-1, result.getExitCode());
        assertEquals("Run limit exceeded", result.getOutput());
    }

    @Test
    void runCodeInSession_LockFailed_ReturnsErrorResult() throws Exception {
        when(sessionRegistry.getBySessionId(sessionId)).thenReturn(sessionInfo);
        when(runRateLimiter.allow(projectId)).thenReturn(true);
        when(executionLockService.tryLock(projectId)).thenReturn(false);

        CommandResult result = runCodeService.runCodeInSession(sessionId, "main.py", 10, userId, msg -> {});

        assertEquals(-1, result.getExitCode());
        assertEquals("Another execution is running", result.getOutput());
    }

    @Test
    void runCodeInSession_FileNotFound_ThrowsException() throws Exception {
        when(sessionRegistry.getBySessionId(sessionId)).thenReturn(sessionInfo);
        when(runRateLimiter.allow(projectId)).thenReturn(true);
        when(executionLockService.tryLock(projectId)).thenReturn(true);
        when(fileSyncService.sanitizeUserPath("main.py")).thenReturn("main.py");
        when(fileRepo.findByProjectIdAndPath(projectId, "main.py")).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, 
                () -> runCodeService.runCodeInSession(sessionId, "main.py", 10, userId, msg -> {}));

        verify(executionLockService).unlock(projectId); // Ensure lock is released even on exception
    }
}

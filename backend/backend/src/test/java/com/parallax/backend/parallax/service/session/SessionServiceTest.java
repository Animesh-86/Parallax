package com.parallax.backend.parallax.service.session;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.file.FileSyncService;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private ProjectRepository projectRepo;
    @Mock
    private FileSyncService fileSyncService;
    @Mock
    private SessionRegistry sessionRegistry;
    @Mock
    private ProjectAccessManager accessManager;

    @InjectMocks
    private SessionService sessionService;

    private UUID projectId;
    private UUID userId;
    private Project project;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        project = new Project();
        project.setId(projectId);
        project.setLanguage("python");
    }

    @Test
    void startSession_ProjectNotFound_ThrowsException() {
        doNothing().when(accessManager).require(projectId, userId, ProjectPermission.START_SESSION);
        when(projectRepo.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sessionService.startSession(projectId, userId));
    }

    @Test
    void startSession_ExistingSession_ReturnsExisting() throws Exception {
        doNothing().when(accessManager).require(projectId, userId, ProjectPermission.START_SESSION);
        when(projectRepo.findById(projectId)).thenReturn(Optional.of(project));
        when(sessionRegistry.getSessionIdForProject(projectId)).thenReturn(Optional.of("existing-session-123"));

        String sessionId = sessionService.startSession(projectId, userId);

        assertEquals("existing-session-123", sessionId);
    }

    @Test
    void stopSession_SessionNotFound_DoesNothing() throws Exception {
        String sessionId = "non-existent";
        when(sessionRegistry.getBySessionId(sessionId)).thenReturn(null);

        assertDoesNotThrow(() -> sessionService.stopSession(sessionId, userId));
        verify(accessManager, never()).require(any(), any(), any());
    }

    // Testing the actual successful Docker process execution requires PowerMock or integration tests,
    // so we focus on the access management and registry flow logic.
}

package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
import com.parallax.backend.parallax.entity.collaborator.ProjectCollaborator;
import com.parallax.backend.parallax.exception.ForbiddenException;
import com.parallax.backend.parallax.repository.collaborator.ProjectCollaboratorRepository;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.auth.User;
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
class ProjectAccessManagerImplTest {

    @Mock
    private ProjectCollaboratorRepository collaboratorRepository;

    @InjectMocks
    private ProjectAccessManagerImpl accessManager;

    private UUID projectId;
    private UUID userId;
    private Project project;
    private User user;
    private ProjectCollaborator collaborator;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        
        project = new Project();
        org.springframework.test.util.ReflectionTestUtils.setField(project, "id", projectId);
        
        user = new User("Test", "test", "t@t.com", "hash", "LOCAL");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", userId);

        collaborator = new ProjectCollaborator();
        collaborator.setProject(project);
        collaborator.setUser(user);
    }

    @Test
    void require_HasPermissionAndAccepted_DoesNotThrow() {
        collaborator.setRole(CollaboratorRole.OWNER);
        collaborator.setStatus(CollaboratorStatus.ACCEPTED);

        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(collaborator));

        assertDoesNotThrow(() -> accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT));
    }

    @Test
    void require_NoAccessToProject_ThrowsForbidden() {
        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, 
                () -> accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT));
    }

    @Test
    void require_LacksPermission_ThrowsForbidden() {
        collaborator.setRole(CollaboratorRole.VIEWER); // Viewer cannot CREATE_FILE
        collaborator.setStatus(CollaboratorStatus.ACCEPTED);

        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(collaborator));

        assertThrows(ForbiddenException.class, 
                () -> accessManager.require(projectId, userId, ProjectPermission.CREATE_FILE));
    }

    @Test
    void require_NotAcceptedStatus_ThrowsForbidden() {
        collaborator.setRole(CollaboratorRole.OWNER);
        collaborator.setStatus(CollaboratorStatus.PENDING); // Not accepted

        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(collaborator));

        assertThrows(ForbiddenException.class, 
                () -> accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT));
    }

    @Test
    void requireOwner_IsOwnerAndAccepted_DoesNotThrow() {
        collaborator.setRole(CollaboratorRole.OWNER);
        collaborator.setStatus(CollaboratorStatus.ACCEPTED);

        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(collaborator));

        assertDoesNotThrow(() -> accessManager.requireOwner(projectId, userId));
    }

    @Test
    void requireOwner_IsNotOwner_ThrowsForbidden() {
        collaborator.setRole(CollaboratorRole.ADMIN); // Admin is not Owner
        collaborator.setStatus(CollaboratorStatus.ACCEPTED);

        when(collaboratorRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(collaborator));

        assertThrows(ForbiddenException.class, () -> accessManager.requireOwner(projectId, userId));
    }
}

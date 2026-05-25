package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.dto.project.ProjectResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.exception.DuplicateResourceException;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.collaborator.ProjectCollaboratorRepository;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.repository.team.TeamRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.team.TeamServiceImpl;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectFileRepository projectFileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectCollaboratorRepository collaboratorRepo;
    @Mock
    private SessionRegistry sessionRegistry;
    @Mock
    private StorageProperties storageProperties;
    @Mock
    private ProjectAccessManager accessManager;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private TeamServiceImpl teamService;

    @InjectMocks
    private ProjectServiceImpl projectService;

    private User owner;
    private Project project;
    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException {
        owner = new User("Test", "test", "t@t.com", "hash", "LOCAL");
        org.springframework.test.util.ReflectionTestUtils.setField(owner, "id", UUID.randomUUID());

        project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Test Project");
        project.setLanguage("python");
        project.setOwner(owner);

        tempDir = Files.createTempDirectory("parallax-test");
    }

    @AfterEach
    void tearDown() throws IOException {
        Files.walk(tempDir)
            .sorted(Comparator.reverseOrder())
            .map(Path::toFile)
            .forEach(File::delete);
    }

    @Test
    void createProject_Success() {
        CreateProjectRequest req = new CreateProjectRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(req, "name", "Test Project");
        org.springframework.test.util.ReflectionTestUtils.setField(req, "language", "python");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.existsByOwner_IdAndName(owner.getId(), "Test Project")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(project);
        when(storageProperties.getProjects()).thenReturn(tempDir.toString());

        ProjectResponse response = projectService.createProject(req, owner.getId());

        assertNotNull(response);
        assertEquals("Test Project", response.getName());
        verify(projectRepository).save(any(Project.class));
        verify(projectFileRepository).saveAll(anyList());
        verify(collaboratorRepo).save(any());
    }

    @Test
    void createProject_DuplicateName_ThrowsException() {
        CreateProjectRequest req = new CreateProjectRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(req, "name", "Test Project");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.existsByOwner_IdAndName(owner.getId(), "Test Project")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> projectService.createProject(req, owner.getId()));
    }

    @Test
    void getProject_Success() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectFileRepository.findByProjectId(project.getId())).thenReturn(List.of());
        doNothing().when(accessManager).require(project.getId(), owner.getId(), ProjectPermission.READ_FILE);

        ProjectResponse response = projectService.getProject(project.getId(), owner.getId());

        assertNotNull(response);
        assertEquals(project.getId(), response.getId());
    }

    @Test
    void getProject_NotFound_ThrowsException() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.empty());
        doNothing().when(accessManager).require(project.getId(), owner.getId(), ProjectPermission.READ_FILE);

        assertThrows(ResourceNotFoundException.class, () -> projectService.getProject(project.getId(), owner.getId()));
    }
}

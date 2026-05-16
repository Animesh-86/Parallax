package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.dto.project.ProjectResponse;
import com.parallax.backend.parallax.dto.project.UpdateProjectSettingsRequest;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.ProjectCollaborator;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.team.Team;
import com.parallax.backend.parallax.exception.DuplicateResourceException;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.*;
import com.parallax.backend.parallax.repository.collaborator.ProjectCollaboratorRepository;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.repository.team.TeamRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.team.TeamServiceImpl;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

import static com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus.ACCEPTED;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final Logger log =
            LoggerFactory.getLogger(ProjectServiceImpl.class);

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final UserRepository userRepository;
    private final ProjectCollaboratorRepository collaboratorRepo;
    private final SessionRegistry sessionRegistry;
    private final StorageProperties storageProperties;
    private final ProjectAccessManager accessManager;
    private final TeamRepository teamRepository;
    private final TeamServiceImpl teamService;

    // CREATE PROJECT
    @Override
    @Transactional
    public ProjectResponse createProject(
            CreateProjectRequest request,
            UUID ownerId
    ) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        validateProjectName(request.getName());

        if (projectRepository.existsByOwner_IdAndName(ownerId, request.getName())) {
            throw new DuplicateResourceException("Project name already exists");
        }

        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName(request.getName());
        // Force language to lowercase for consistent matching
        project.setLanguage(request.getLanguage() != null ? request.getLanguage().toLowerCase() : "python");
        project.setOwner(owner);
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());

        // Link to team if teamId is provided
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + request.getTeamId()));
            project.setTeam(team);
        }

        project = projectRepository.save(project);

        // DEFAULT FILES - using the normalized language
        List<ProjectFile> initialFiles =
                createDefaultFiles(project.getId(), project.getLanguage());

        projectFileRepository.saveAll(initialFiles);
        createProjectRootOnDisk(project.getId(), initialFiles);

        // OWNER AS COLLABORATOR (CRITICAL)
        registerOwnerCollaborator(project, owner);

        // Auto-sync team members as collaborators
        if (project.getTeam() != null) {
            teamService.syncAllTeamMembersToProject(project.getTeam(), project);
        }

        return ProjectResponse.from(project, initialFiles, null);
    }

    // GET PROJECT

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(
            UUID projectId,
            UUID requesterId
    ) {
        accessManager.require(
                projectId,
                requesterId,
                ProjectPermission.READ_FILE
        );

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Project not found: " + projectId));

        List<ProjectFile> files =
                projectFileRepository.findByProjectId(projectId);

        SessionRegistry.SessionInfo session =
                sessionRegistry.getByProject(projectId);

        String activeSessionId =
                session == null ? null : session.getSessionId();

        return ProjectResponse.from(project, files, activeSessionId);
    }

    // LIST USER PROJECTS
    @Override
    public List<ProjectResponse> getProjectsForUser(UUID userId) {

        Objects.requireNonNull(userId, "userId must not be null");

        List<Project> owned =
                projectRepository.findByOwner_Id(userId);

        List<ProjectCollaborator> collabs =
                collaboratorRepo.findAllByUserId(userId)
                        .stream()
                        .filter(c -> c.getStatus() == ACCEPTED)
                        .toList();

        Set<UUID> seen = new HashSet<>();
        List<ProjectResponse> result = new ArrayList<>();

        for (Project project : owned) {
            seen.add(project.getId());
            result.add(toResponse(project));
        }

        for (ProjectCollaborator c : collabs) {
            Project project = c.getProject();
            if (seen.add(project.getId())) {
                result.add(toResponse(project));
            }
        }

        return result;
    }

    // INTERNAL HELPERS

    private void registerOwnerCollaborator(Project project, User owner) {

        ProjectCollaborator ownerRow =
                new ProjectCollaborator(
                        project,
                        owner,
                        CollaboratorRole.OWNER
                );

        ownerRow.setStatus(ACCEPTED);
        ownerRow.setAcceptedAt(Instant.now());

        collaboratorRepo.save(ownerRow);
    }

    private ProjectResponse toResponse(Project project) {

        List<ProjectFile> files =
                projectFileRepository.findByProjectId(project.getId());

        String activeSessionId =
                sessionRegistry
                        .getSessionIdForProject(project.getId())
                        .orElse(null);

        ProjectResponse response = ProjectResponse.from(project, files, activeSessionId);
        
        // Inject runtime info based on language
        response.setRuntimeName(getRuntimeName(project.getLanguage()));
        
        return response;
    }

    private String getRuntimeName(String language) {
        if (language == null) return "Standard Sandbox";
        return switch (language.toLowerCase()) {
            case "java" -> "OpenJDK 17 / Maven 3.9";
            case "python" -> "Python 3.11 / Pip";
            case "javascript", "typescript" -> "Node.js 20 / NPM";
            case "c" -> "GCC 12 / GDB";
            case "cpp" -> "G++ 12 / CMake";
            default -> "Standard Sandbox";
        };
    }

    private void validateProjectName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be empty");
        }
        if (name.length() > 50) {
            throw new IllegalArgumentException("Project name too long");
        }
        if (!name.matches("[A-Za-z0-9_\\- ]+")) {
            throw new IllegalArgumentException(
                    "Project name contains invalid characters");
        }
    }

    private void createProjectRootOnDisk(
            UUID projectId,
            List<ProjectFile> initialFiles
    ) {
        Path projectRoot =
                Paths.get(storageProperties.getProjects())
                        .resolve(projectId.toString());

        try {
            Files.createDirectories(projectRoot);

            for (ProjectFile f : initialFiles) {

                Path p = projectRoot.resolve(f.getPath());

                if ("FOLDER".equals(f.getType())) {
                    Files.createDirectories(p);
                } else {
                    if (p.getParent() != null) {
                        Files.createDirectories(p.getParent());
                    }
                    Files.writeString(
                            p,
                            f.getContent() == null ? "" : f.getContent(),
                            StandardCharsets.UTF_8,
                            StandardOpenOption.CREATE,
                            StandardOpenOption.TRUNCATE_EXISTING
                    );
                }
            }

            log.info(
                    "Project {} created at {}",
                    projectId,
                    projectRoot
            );

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to create project directory structure",
                    e
            );
        }
    }

    private List<ProjectFile> createDefaultFiles(UUID projectId, String language) {

        List<ProjectFile> files = new ArrayList<>();

        files.add(new ProjectFile(
                UUID.randomUUID(),
                projectId,
                "src",
                null,
                "FOLDER"
        ));

        String mainFile = "README.md";
        String mainContent = "# New Project\n\nThis project was created in Parallax.";
        
        if (language != null) {
            switch (language.toLowerCase()) {
                case "python" -> {
                    mainFile = "src/main.py";
                    mainContent = "print('Hello from Parallax!')";
                }
                case "java" -> {
                    mainFile = "src/Main.java";
                    mainContent = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Parallax!\");\n    }\n}";
                }
                case "javascript" -> {
                    mainFile = "src/index.js";
                    mainContent = "console.log('Hello from Parallax!');";
                }
                case "c" -> {
                    mainFile = "src/main.c";
                    mainContent = "#include <stdio.h>\n\nint main() {\n    printf(\"Hello from Parallax!\\n\");\n    return 0;\n}";
                }
                case "cpp" -> {
                    mainFile = "src/main.cpp";
                    mainContent = "#include <iostream>\n\nint main() {\n    std::cout << \"Hello from Parallax!\" << std::endl;\n    return 0;\n}";
                }
            }
        }

        files.add(new ProjectFile(
                UUID.randomUUID(),
                projectId,
                mainFile,
                mainContent,
                "FILE"
        ));

        files.add(new ProjectFile(
                UUID.randomUUID(),
                projectId,
                "README.md",
                "# " + language + " Project\n\nGenerated by Parallax.",
                "FILE"
        ));

        return files;
    }

    // LINK / UNLINK PROJECT TO TEAM
    @Override
    @Transactional
    public ProjectResponse linkProjectToTeam(UUID projectId, UUID requesterId, UUID teamId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        // Only the project owner can link/unlink
        if (!project.getOwner().getId().equals(requesterId)) {
            throw new SecurityException("Only the project owner can link/unlink a project to a team");
        }

        if (teamId == null) {
            // Unlink
            project.setTeam(null);
        } else {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
            project.setTeam(team);

            // Auto-sync team members
            teamService.syncAllTeamMembersToProject(team, project);
        }

        project.setUpdatedAt(Instant.now());
        project = projectRepository.save(project);

        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse updateSettings(UUID projectId, UUID requesterId, UpdateProjectSettingsRequest request) {
        accessManager.require(projectId, requesterId, ProjectPermission.MANAGE_SETTINGS);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getSettingsJson() != null) {
            project.setSettingsJson(request.getSettingsJson());
        }

        project.setUpdatedAt(Instant.now());
        project = projectRepository.save(project);
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse toggleExtension(UUID projectId, UUID requesterId, String extensionId, boolean enabled) {
        accessManager.require(projectId, requesterId, ProjectPermission.MANAGE_EXTENSIONS);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        String currentExtJson = project.getEnabledExtensionsJson();
        List<String> extensions = new ArrayList<>();
        if (currentExtJson != null && !currentExtJson.equals("[]") && !currentExtJson.isBlank()) {
            // Very basic JSON parsing since we don't have a complex mapper here
            String clean = currentExtJson.replace("[", "").replace("]", "").replace("\"", "");
            if (!clean.isBlank()) {
                extensions.addAll(Arrays.asList(clean.split(",")));
            }
        }

        if (enabled) {
            if (!extensions.contains(extensionId)) {
                extensions.add(extensionId);
            }
        } else {
            extensions.remove(extensionId);
        }

        // Re-serialize (very basic)
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < extensions.size(); i++) {
            sb.append("\"").append(extensions.get(i).trim()).append("\"");
            if (i < extensions.size() - 1) sb.append(",");
        }
        sb.append("]");
        project.setEnabledExtensionsJson(sb.toString());

        project.setUpdatedAt(Instant.now());
        project = projectRepository.save(project);
        return toResponse(project);
    }
}

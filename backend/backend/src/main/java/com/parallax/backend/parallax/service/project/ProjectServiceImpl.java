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
    private final com.parallax.backend.parallax.repository.project.MergeRequestRepository mergeRequestRepository;
    private final com.parallax.backend.parallax.repository.chat.ChatRepository chatRepository;
    private final com.parallax.backend.parallax.repository.collaborator.ProjectInvitationRepository projectInvitationRepository;
    @org.springframework.context.annotation.Lazy
    private final com.parallax.backend.parallax.service.github.GitHubService githubService;

    private final ProjectProvisioningService provisioningService;
    private final ProjectTemplateService templateService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

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

        String projectName = request.getName().trim();
        validateProjectName(projectName);

        if (projectRepository.existsByOwnerIdAndNameIgnoreCase(ownerId, projectName)) {
            throw new DuplicateResourceException("Project name already exists");
        }

        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName(projectName);
        // Force language to lowercase for consistent matching
        project.setLanguage(request.getLanguage() != null ? request.getLanguage().toLowerCase() : "python");
        project.setOwner(owner);
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        project.setGithubRepoUrl(request.getGithubRepoUrl());
        project.setAiReviewEnabled(request.isAiReviewEnabled());

        // Link to team if teamId is provided
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + request.getTeamId()));
            project.setTeam(team);
        }

        project = projectRepository.save(project);

        // OWNER AS COLLABORATOR (CRITICAL)
        registerOwnerCollaborator(project, owner);

        // Auto-sync team members as collaborators
        if (project.getTeam() != null) {
            teamService.syncAllTeamMembersToProject(project.getTeam(), project);
        }

        List<ProjectFile> finalFiles;
        if (project.getGithubRepoUrl() != null && !project.getGithubRepoUrl().isBlank()) {
            finalFiles = githubService.importRepositoryToProject(project, ownerId);
            if (!finalFiles.isEmpty()) {
                projectFileRepository.saveAll(finalFiles);
            }
        } else {
            finalFiles = templateService.createDefaultFiles(project.getId(), project.getLanguage());
            projectFileRepository.saveAll(finalFiles);
        }

        // ALWAYS create the root directory, even if GitHub import failed and finalFiles is empty
        provisioningService.createProjectRootOnDisk(project.getId(), finalFiles);

        // Emit Gamification Event for creating a project
        eventPublisher.publishEvent(new com.parallax.backend.parallax.service.gamification.GamificationEvent(
                this, owner.getId(), com.parallax.backend.parallax.service.gamification.GamificationEvent.EventType.PROJECT_CREATE, "Created project " + project.getName(), project.getId()
        ));

        return ProjectResponse.from(project, finalFiles, null);
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

    @Override
    @Transactional
    public ProjectResponse archiveProject(UUID projectId, UUID requesterId) {
        accessManager.require(projectId, requesterId, ProjectPermission.OWNER_ONLY);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        project.setArchived(true);
        projectRepository.save(project);
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse unarchiveProject(UUID projectId, UUID requesterId) {
        accessManager.require(projectId, requesterId, ProjectPermission.OWNER_ONLY);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        project.setArchived(false);
        projectRepository.save(project);
        return toResponse(project);
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
        if (request.getGithubRepoUrl() != null) {
            boolean wasEmpty = project.getGithubRepoUrl() == null || project.getGithubRepoUrl().isBlank();
            project.setGithubRepoUrl(request.getGithubRepoUrl());
            if (wasEmpty && !request.getGithubRepoUrl().isBlank()) {
                List<ProjectFile> importedFiles = githubService.importRepositoryToProject(project, requesterId);
                if (importedFiles != null && !importedFiles.isEmpty()) {
                    // Save files to DB and Disk
                    projectFileRepository.deleteByProjectId(project.getId());
                    projectFileRepository.flush(); // ensure deletion before insert
                    projectFileRepository.saveAll(importedFiles);
                    provisioningService.deleteProjectRootFromDisk(project.getId());
                    provisioningService.createProjectRootOnDisk(project.getId(), importedFiles);
                }
            }
        }
        if (request.getAiReviewEnabled() != null) {
            project.setAiReviewEnabled(request.getAiReviewEnabled());
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

    @Override
    @Transactional
    public void createPullRequest(UUID projectId, UUID requesterId, String branchName, String prTitle, String commitMessage) {
        accessManager.require(projectId, requesterId, ProjectPermission.MANAGE_SETTINGS);
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        githubService.createPullRequest(project, branchName, prTitle, commitMessage);
    }

    @Override
    @Transactional
    public void deleteProject(UUID projectId, UUID requesterId) {
        accessManager.require(projectId, requesterId, ProjectPermission.OWNER_ONLY);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        // Delete child entities to prevent foreign key constraint violations
        projectFileRepository.deleteByProjectId(projectId);
        chatRepository.deleteByProjectId(projectId);
        mergeRequestRepository.deleteByProject_Id(projectId);
        projectInvitationRepository.deleteByProjectId(projectId);
        collaboratorRepo.deleteByProjectId(projectId);
        
        projectRepository.delete(project);

        // Delete from disk
        provisioningService.deleteProjectRootFromDisk(projectId);
    }
}

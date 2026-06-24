package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.dto.project.ProjectResponse;
import com.parallax.backend.parallax.dto.project.CreatePullRequestDto;
import com.parallax.backend.parallax.dto.project.LinkProjectTeamDto;
import com.parallax.backend.parallax.dto.project.ToggleExtensionDto;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.project.ProjectService;
import com.parallax.backend.parallax.service.project.ProjectServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectServiceImpl projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);

        ProjectResponse response = projectService.createProject(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping(value = "/{projectId}", produces = "application/json")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        ProjectResponse response = projectService.getProject(projectId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication auth) {

        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }

        UUID userId = AuthUtil.requireUserId(auth);

        List<ProjectResponse> projects =
                projectService.getProjectsForUser(userId);

        return ResponseEntity.ok(projects);
    }

    @PatchMapping("/{projectId}/team")
    public ResponseEntity<ProjectResponse> linkProjectToTeam(
            @PathVariable UUID projectId,
            @RequestBody LinkProjectTeamDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        UUID teamId = body.teamId();
        ProjectResponse response = projectService.linkProjectToTeam(projectId, userId, teamId);
        return ResponseEntity.ok(response);
    }
    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProjectSettings(
            @PathVariable UUID projectId,
            @RequestBody com.parallax.backend.parallax.dto.project.UpdateProjectSettingsRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        ProjectResponse response = projectService.updateSettings(projectId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{projectId}/extensions")
    public ResponseEntity<ProjectResponse> toggleExtension(
            @PathVariable UUID projectId,
            @Valid @RequestBody ToggleExtensionDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String extensionId = body.extensionId();
        Boolean enabled = body.enabled();

        ProjectResponse response = projectService.toggleExtension(projectId, userId, extensionId, enabled);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{projectId}/github/pr")
    public ResponseEntity<Void> createPullRequest(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreatePullRequestDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String branchName = body.branchName();
        String prTitle = body.title();
        String commitMessage = body.message();

        projectService.createPullRequest(projectId, userId, branchName, prTitle, commitMessage);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        projectService.deleteProject(projectId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{projectId}/archive")
    public ResponseEntity<ProjectResponse> archiveProject(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        ProjectResponse response = projectService.archiveProject(projectId, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{projectId}/unarchive")
    public ResponseEntity<ProjectResponse> unarchiveProject(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        ProjectResponse response = projectService.unarchiveProject(projectId, userId);
        return ResponseEntity.ok(response);
    }
}

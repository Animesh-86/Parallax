package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.dto.project.ProjectResponse;
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
@RequestMapping("/api/projects")
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
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String teamIdStr = body.get("teamId"); // null means unlink
        UUID teamId = teamIdStr != null && !teamIdStr.isBlank() ? UUID.fromString(teamIdStr) : null;
        ProjectResponse response = projectService.linkProjectToTeam(projectId, userId, teamId);
        return ResponseEntity.ok(response);
    }
}

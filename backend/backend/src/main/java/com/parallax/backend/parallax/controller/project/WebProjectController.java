package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.execution.WebProjectExecutionService;
import com.parallax.backend.parallax.service.execution.WebProjectExecutionService.WebProjectStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/web-server")
@RequiredArgsConstructor
public class WebProjectController {

    private final WebProjectExecutionService webProjectService;
    private final ProjectAccessManager accessManager;

    @PostMapping
    public ResponseEntity<WebProjectStatus> startServer(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.EXECUTE_CODE);
        WebProjectStatus status = webProjectService.startServer(projectId);
        return ResponseEntity.ok(status);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> stopServer(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.STOP_SESSION);
        webProjectService.stopServer(projectId);
        return ResponseEntity.ok(Map.of("message", "Server stopped"));
    }

    @GetMapping
    public ResponseEntity<WebProjectStatus> getServerStatus(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        WebProjectStatus status = webProjectService.getServerStatus(projectId);
        return ResponseEntity.ok(status);
    }
}

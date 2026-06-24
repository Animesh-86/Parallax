package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.dto.file.FileNodeDto;
import com.parallax.backend.parallax.dto.project.ProjectBranchResponse;
import com.parallax.backend.parallax.dto.project.ProjectResponse;
import com.parallax.backend.parallax.dto.project.WorkspaceBootstrapResponse;
import com.parallax.backend.parallax.dto.profile.ProfileResponse;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.file.FileTreeService;
import com.parallax.backend.parallax.service.profile.ProfileQueryService;
import com.parallax.backend.parallax.service.project.ProjectServiceImpl;
import com.parallax.backend.parallax.service.project.VersioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspace")
@RequiredArgsConstructor
public class WorkspaceBootstrapController {

    private final ProjectServiceImpl projectService;
    private final FileTreeService fileTreeService;
    private final VersioningService versioningService;
    private final ProfileQueryService profileQueryService;

    @GetMapping("/{projectId}/bootstrap")
    public ResponseEntity<WorkspaceBootstrapResponse> bootstrap(
            @PathVariable UUID projectId,
            Authentication auth
    ) {
        UUID userId = AuthUtil.requireUserId(auth);

        // 1. Project details
        ProjectResponse project = projectService.getProject(projectId, userId);

        // 2. File tree
        List<FileNodeDto> fileTree = fileTreeService.getTree(projectId, userId);

        // 3. Branches
        ProjectBranchResponse mainBranch = null;
        List<ProjectBranchResponse> branches = null;
        try {
            mainBranch = versioningService.ensureMainBranch(projectId, userId);
            branches = versioningService.getBranches(projectId);
        } catch (Exception e) {
            // Versioning might not be initialized or available, fail gracefully
        }

        // 4. IDE Settings
        ProfileResponse profile = profileQueryService.getMyProfile(userId);
        String ideSettings = profile.getIdeSettings();

        WorkspaceBootstrapResponse response = new WorkspaceBootstrapResponse(
                project,
                fileTree,
                branches,
                mainBranch,
                ideSettings
        );

        return ResponseEntity.ok(response);
    }
}

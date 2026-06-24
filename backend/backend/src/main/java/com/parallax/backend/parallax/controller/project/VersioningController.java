package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.dto.project.MergeRequestResponse;
import com.parallax.backend.parallax.dto.project.ProjectBranchResponse;
import com.parallax.backend.parallax.dto.project.ProjectCommitResponse;
import com.parallax.backend.parallax.dto.project.*;
import com.parallax.backend.parallax.entity.project.MergeRequestStatus;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.project.VersioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/git")
@RequiredArgsConstructor
public class VersioningController {

    private final VersioningService versioningService;
    private final ProjectAccessManager accessManager;
    private static final String BRANCH_NAME_REGEX = "^[a-zA-Z0-9_/-]+$";

    private boolean isValidBranchName(String name) {
        return name != null && name.matches(BRANCH_NAME_REGEX) && !name.startsWith("-");
    }

    // ========== BRANCHES ==========

    @GetMapping("/branches")
    public ResponseEntity<List<ProjectBranchResponse>> getBranches(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        // Ensure main branch exists
        var branches = versioningService.getBranches(projectId);
        return ResponseEntity.ok(branches);
    }

    @PostMapping("/branches")
    public ResponseEntity<ProjectBranchResponse> createBranch(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateBranchDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        String name = body.name().trim();
        if (!isValidBranchName(name)) {
            return ResponseEntity.badRequest().build();
        }

        // Ensure main branch exists first
        versioningService.ensureMainBranch(projectId, userId);

        var branch = versioningService.createBranch(projectId, name, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(branch);
    }

    @PostMapping("/branches/ensure-main")
    public ResponseEntity<ProjectBranchResponse> ensureMainBranch(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        var main = versioningService.ensureMainBranch(projectId, userId);
        return ResponseEntity.ok(main);
    }

    @PostMapping("/branches/{branchName}/checkout")
    public ResponseEntity<Void> checkoutBranch(
            @PathVariable UUID projectId,
            @PathVariable String branchName,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        if (!isValidBranchName(branchName)) {
            return ResponseEntity.badRequest().build();
        }
        versioningService.checkoutBranch(projectId, branchName);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/branches/{branchName}")
    public ResponseEntity<Void> deleteBranch(
            @PathVariable UUID projectId,
            @PathVariable String branchName,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        if (!isValidBranchName(branchName)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            versioningService.deleteBranch(projectId, branchName);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/branches/{branchName}/push")
    public ResponseEntity<Map<String, String>> pushBranch(
            @PathVariable UUID projectId,
            @PathVariable String branchName,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        try {
            versioningService.pushToRemote(projectId, branchName);
            return ResponseEntity.ok(Map.of("message", "Successfully pushed to GitHub"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/remote")
    public ResponseEntity<Map<String, String>> setRemoteUrl(
            @PathVariable UUID projectId,
            @Valid @RequestBody SetRemoteUrlDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.MANAGE_SETTINGS);
        String url = body.url();
        
        versioningService.setRemoteUrl(projectId, url.trim());
        return ResponseEntity.ok(Map.of("message", "Remote URL set successfully"));
    }

    // ========== COMMITS ==========

    @GetMapping("/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getCommits(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        var commits = versioningService.getCommits(projectId);
        return ResponseEntity.ok(commits);
    }

    @GetMapping("/branches/{branchId}/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getBranchCommits(
            @PathVariable UUID projectId,
            @PathVariable String branchId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        var commits = versioningService.getBranchCommits(projectId, branchId);
        return ResponseEntity.ok(commits);
    }

    @PostMapping("/commits")
    public ResponseEntity<ProjectCommitResponse> createCommit(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCommitDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        String branchIdStr = body.branchId();
        String message = body.message().trim();

        var commit = versioningService.createCommit(projectId, branchIdStr, userId, message);
        return ResponseEntity.status(HttpStatus.CREATED).body(commit);
    }

    // ========== MERGE REQUESTS ==========

    @GetMapping("/merge-requests")
    public ResponseEntity<List<MergeRequestResponse>> getMergeRequests(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        var mrs = versioningService.getMergeRequests(projectId);
        return ResponseEntity.ok(mrs.stream().map(MergeRequestResponse::from).toList());
    }

    @GetMapping("/merge-requests/open")
    public ResponseEntity<List<MergeRequestResponse>> getOpenMergeRequests(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        var mrs = versioningService.getOpenMergeRequests(projectId);
        return ResponseEntity.ok(mrs.stream().map(MergeRequestResponse::from).toList());
    }

    @PostMapping("/merge-requests")
    public ResponseEntity<MergeRequestResponse> createMergeRequest(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateMergeRequestDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        String sourceBranchId = body.sourceBranchId();
        String targetBranchId = body.targetBranchId();
        String title = body.title().trim();
        String description = body.description() != null ? body.description() : "";

        var mr = versioningService.createMergeRequest(
                projectId,
                sourceBranchId,
                targetBranchId,
                userId, title, description
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(MergeRequestResponse.from(mr));
    }

    @PatchMapping("/merge-requests/{mrId}")
    public ResponseEntity<MergeRequestResponse> updateMergeRequestStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID mrId,
            @Valid @RequestBody UpdateMergeRequestStatusDto body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);
        MergeRequestStatus newStatus = body.status();
        var mr = versioningService.updateMergeRequestStatus(mrId, newStatus, userId);
        return ResponseEntity.ok(MergeRequestResponse.from(mr));
    }

    // ========== UTILS ==========

    @GetMapping("/diff")
    public ResponseEntity<Map<String, String>> getDiff(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_PROJECT);
        String diff = versioningService.getGitDiff(projectId);
        return ResponseEntity.ok(Map.of("diff", diff != null ? diff : ""));
    }
}

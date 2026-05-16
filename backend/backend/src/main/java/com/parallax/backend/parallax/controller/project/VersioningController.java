package com.parallax.backend.parallax.controller.project;

import com.parallax.backend.parallax.dto.project.MergeRequestResponse;
import com.parallax.backend.parallax.dto.project.ProjectBranchResponse;
import com.parallax.backend.parallax.dto.project.ProjectCommitResponse;
import com.parallax.backend.parallax.entity.project.MergeRequestStatus;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.project.VersioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/versioning")
@RequiredArgsConstructor
public class VersioningController {

    private final VersioningService versioningService;

    // ========== BRANCHES ==========

    @GetMapping("/branches")
    public ResponseEntity<List<ProjectBranchResponse>> getBranches(@PathVariable UUID projectId) {
        // Ensure main branch exists
        var branches = versioningService.getBranches(projectId);
        return ResponseEntity.ok(branches.stream().map(ProjectBranchResponse::from).toList());
    }

    @PostMapping("/branches")
    public ResponseEntity<ProjectBranchResponse> createBranch(
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String name = body.getOrDefault("name", "").trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Ensure main branch exists first
        versioningService.ensureMainBranch(projectId, userId);

        var branch = versioningService.createBranch(projectId, name, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectBranchResponse.from(branch));
    }

    @PostMapping("/branches/ensure-main")
    public ResponseEntity<ProjectBranchResponse> ensureMainBranch(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        var main = versioningService.ensureMainBranch(projectId, userId);
        return ResponseEntity.ok(ProjectBranchResponse.from(main));
    }

    // ========== COMMITS ==========

    @GetMapping("/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getCommits(@PathVariable UUID projectId) {
        var commits = versioningService.getCommits(projectId);
        return ResponseEntity.ok(commits.stream().map(ProjectCommitResponse::from).toList());
    }

    @GetMapping("/branches/{branchId}/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getBranchCommits(
            @PathVariable UUID projectId,
            @PathVariable UUID branchId
    ) {
        var commits = versioningService.getBranchCommits(branchId);
        return ResponseEntity.ok(commits.stream().map(ProjectCommitResponse::from).toList());
    }

    @PostMapping("/commits")
    public ResponseEntity<ProjectCommitResponse> createCommit(
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String branchIdStr = body.get("branchId");
        String message = body.getOrDefault("message", "").trim();

        if (branchIdStr == null || message.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        UUID branchId = UUID.fromString(branchIdStr);
        var commit = versioningService.createCommit(projectId, branchId, userId, message);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectCommitResponse.from(commit));
    }

    // ========== MERGE REQUESTS ==========

    @GetMapping("/merge-requests")
    public ResponseEntity<List<MergeRequestResponse>> getMergeRequests(@PathVariable UUID projectId) {
        var mrs = versioningService.getMergeRequests(projectId);
        return ResponseEntity.ok(mrs.stream().map(MergeRequestResponse::from).toList());
    }

    @GetMapping("/merge-requests/open")
    public ResponseEntity<List<MergeRequestResponse>> getOpenMergeRequests(@PathVariable UUID projectId) {
        var mrs = versioningService.getOpenMergeRequests(projectId);
        return ResponseEntity.ok(mrs.stream().map(MergeRequestResponse::from).toList());
    }

    @PostMapping("/merge-requests")
    public ResponseEntity<MergeRequestResponse> createMergeRequest(
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String sourceBranchId = body.get("sourceBranchId");
        String targetBranchId = body.get("targetBranchId");
        String title = body.getOrDefault("title", "").trim();
        String description = body.getOrDefault("description", "");

        if (sourceBranchId == null || targetBranchId == null || title.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var mr = versioningService.createMergeRequest(
                projectId,
                UUID.fromString(sourceBranchId),
                UUID.fromString(targetBranchId),
                userId, title, description
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(MergeRequestResponse.from(mr));
    }

    @PatchMapping("/merge-requests/{mrId}")
    public ResponseEntity<MergeRequestResponse> updateMergeRequestStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID mrId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }

        MergeRequestStatus newStatus = MergeRequestStatus.valueOf(statusStr.toUpperCase());
        var mr = versioningService.updateMergeRequestStatus(mrId, newStatus, userId);
        return ResponseEntity.ok(MergeRequestResponse.from(mr));
    }
}

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
        return ResponseEntity.ok(branches);
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
        return ResponseEntity.status(HttpStatus.CREATED).body(branch);
    }

    @PostMapping("/branches/ensure-main")
    public ResponseEntity<ProjectBranchResponse> ensureMainBranch(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        var main = versioningService.ensureMainBranch(projectId, userId);
        return ResponseEntity.ok(main);
    }

    @PostMapping("/branches/{branchName}/checkout")
    public ResponseEntity<Void> checkoutBranch(
            @PathVariable UUID projectId,
            @PathVariable String branchName,
            Authentication authentication
    ) {
        versioningService.checkoutBranch(projectId, branchName);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/branches/{branchName}")
    public ResponseEntity<Void> deleteBranch(
            @PathVariable UUID projectId,
            @PathVariable String branchName,
            Authentication authentication
    ) {
        try {
            versioningService.deleteBranch(projectId, branchName);
            return ResponseEntity.ok().build();
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
        try {
            versioningService.pushToRemote(projectId, branchName);
            return ResponseEntity.ok(Map.of("message", "Successfully pushed to GitHub"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== COMMITS ==========

    @GetMapping("/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getCommits(@PathVariable UUID projectId) {
        var commits = versioningService.getCommits(projectId);
        return ResponseEntity.ok(commits);
    }

    @GetMapping("/branches/{branchId}/commits")
    public ResponseEntity<List<ProjectCommitResponse>> getBranchCommits(
            @PathVariable UUID projectId,
            @PathVariable String branchId
    ) {
        var commits = versioningService.getBranchCommits(projectId, branchId);
        return ResponseEntity.ok(commits);
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

        var commit = versioningService.createCommit(projectId, branchIdStr, userId, message);
        return ResponseEntity.status(HttpStatus.CREATED).body(commit);
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

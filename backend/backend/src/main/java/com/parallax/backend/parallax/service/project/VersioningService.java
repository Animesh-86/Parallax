package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.dto.project.ProjectBranchResponse;
import com.parallax.backend.parallax.dto.project.ProjectCommitResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.project.*;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.project.MergeRequestRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.service.gamification.GamificationEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VersioningService {

    private static final Logger log = LoggerFactory.getLogger(VersioningService.class);

    private final ProjectRepository projectRepository;
    private final MergeRequestRepository mergeRequestRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final StorageProperties storageProperties;

    @Value("${github.pat}")
    private String githubPat;

    // ========== GIT RUNNER ==========
    
    private String runGitCommand(UUID projectId, String... args) {
        Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());
        if (!Files.exists(projectRoot)) {
            return "";
        }
        
        List<String> command = new ArrayList<>();
        command.add("git");
        command.addAll(Arrays.asList(args));
        
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(projectRoot.toFile());
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            p.waitFor();
            return output;
        } catch (Exception e) {
            log.error("Failed to run git command in {}: {}", projectRoot, e.getMessage());
            return "";
        }
    }

    private void ensureGitInitialized(UUID projectId) {
        Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());
        Path gitDir = projectRoot.resolve(".git");
        if (!Files.exists(gitDir)) {
            runGitCommand(projectId, "init");
            runGitCommand(projectId, "config", "user.name", "Parallax IDE");
            runGitCommand(projectId, "config", "user.email", "bot@parallax.local");
            runGitCommand(projectId, "checkout", "-b", "main");
            runGitCommand(projectId, "commit", "--allow-empty", "-m", "Initial commit from Parallax");
        }
    }

    // ========== BRANCH OPERATIONS ==========

    public ProjectBranchResponse ensureMainBranch(UUID projectId, UUID userId) {
        ensureGitInitialized(projectId);
        User user = findUser(userId);
        
        return buildBranchResponse(projectId, "main", user);
    }

    public List<ProjectBranchResponse> getBranches(UUID projectId) {
        ensureGitInitialized(projectId);
        
        String output = runGitCommand(projectId, "branch", "--format=%(refname:short)");
        if (output.isBlank()) {
            return List.of(buildBranchResponse(projectId, "main", getSystemUserOrDummy()));
        }
        
        List<ProjectBranchResponse> list = new ArrayList<>();
        User systemUser = getSystemUserOrDummy();
        
        for (String branch : output.split("\n")) {
            String b = branch.trim();
            if (!b.isEmpty()) {
                list.add(buildBranchResponse(projectId, b, systemUser));
            }
        }
        return list;
    }

    public ProjectBranchResponse createBranch(UUID projectId, String name, UUID userId) {
        ensureGitInitialized(projectId);
        User user = findUser(userId);
        
        runGitCommand(projectId, "checkout", "-b", name);
        return buildBranchResponse(projectId, name, user);
    }

    public void checkoutBranch(UUID projectId, String name) {
        ensureGitInitialized(projectId);
        runGitCommand(projectId, "checkout", name);
    }

    public void deleteBranch(UUID projectId, String name) {
        if ("main".equals(name) || "master".equals(name)) {
            throw new IllegalArgumentException("Cannot delete the main branch");
        }
        ensureGitInitialized(projectId);
        // Switch to main before deleting to avoid deleting currently checked out branch
        runGitCommand(projectId, "checkout", "main");
        String output = runGitCommand(projectId, "branch", "-D", name);
        if (output.toLowerCase().contains("error:") || output.toLowerCase().contains("fatal:")) {
            log.error("Git branch delete failed: {}", output);
            throw new IllegalStateException("Failed to delete branch: " + output);
        }
    }

    private ProjectBranchResponse buildBranchResponse(UUID projectId, String name, User user) {
        return ProjectBranchResponse.builder()
                .id(name) // Using name as ID
                .projectId(projectId)
                .name(name)
                .isMain("main".equals(name) || "master".equals(name))
                .createdById(user != null ? user.getId() : UUID.randomUUID())
                .createdByName(user != null ? user.getFullName() : "System")
                .createdAt(Instant.now())
                .build();
    }

    // ========== COMMIT OPERATIONS ==========

    public ProjectCommitResponse createCommit(UUID projectId, String branchName, UUID userId, String message) {
        ensureGitInitialized(projectId);
        Project project = findProject(projectId);
        User user = findUser(userId);

        // Checkout the branch
        runGitCommand(projectId, "checkout", branchName);
        
        // Configure user for commit
        runGitCommand(projectId, "config", "user.name", user.getFullName());
        runGitCommand(projectId, "config", "user.email", user.getEmail());
        
        // Add and commit
        runGitCommand(projectId, "add", ".");
        runGitCommand(projectId, "commit", "-m", message);
        
        String hash = runGitCommand(projectId, "rev-parse", "HEAD");

        ProjectCommitResponse response = ProjectCommitResponse.builder()
                .id(UUID.nameUUIDFromBytes(hash.getBytes()))
                .projectId(projectId)
                .branchId(branchName)
                .branchName(branchName)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .message(message)
                .committedAt(Instant.now())
                .build();

        eventPublisher.publishEvent(new GamificationEvent(
                this, userId, GamificationEvent.EventType.COMMIT, "Committed to " + branchName + " in project " + project.getName(), response.getId()
        ));

        return response;
    }

    public void pushToRemote(UUID projectId, String branchName) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        String url = project.getGithubRepoUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Project is not linked to a GitHub repository. Please set a remote URL first.");
        }
        
        // Remove trailing slash or .git
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
        if (url.endsWith(".git")) url = url.substring(0, url.length() - 4);
        
        String[] parts = url.split("/");
        if (parts.length < 2) throw new IllegalStateException("Invalid GitHub URL");
        String repo = parts[parts.length - 1];
        String owner = parts[parts.length - 2];
        
        // Construct authenticated URL: https://PAT@github.com/owner/repo.git
        String authUrl = String.format("https://%s@github.com/%s/%s.git", githubPat, owner, repo);
        
        // Ensure remote exists
        String remotes = runGitCommand(projectId, "remote");
        if (!remotes.contains("origin")) {
            runGitCommand(projectId, "remote", "add", "origin", authUrl);
        } else {
            runGitCommand(projectId, "remote", "set-url", "origin", authUrl);
        }
        
        String output = runGitCommand(projectId, "push", "-u", "origin", branchName);
        if (output.toLowerCase().contains("error:") || output.toLowerCase().contains("fatal:")) {
            log.error("Git push failed: {}", output);
            throw new IllegalStateException("Failed to push to GitHub: " + output);
        }
    }

    @Transactional
    public void setRemoteUrl(UUID projectId, String url) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setGithubRepoUrl(url);
        projectRepository.save(project);
    }

    public List<ProjectCommitResponse> getCommits(UUID projectId) {
        return getBranchCommits(projectId, "HEAD");
    }

    public List<ProjectCommitResponse> getBranchCommits(UUID projectId, String branchName) {
        ensureGitInitialized(projectId);
        
        // Format: Hash|AuthorName|AuthorEmail|Subject|Date
        String logOutput = runGitCommand(projectId, "log", branchName, "--pretty=format:%H|%an|%ae|%s|%aI");
        if (logOutput.isBlank() || logOutput.startsWith("fatal:")) {
            return List.of();
        }

        List<ProjectCommitResponse> list = new ArrayList<>();
        User systemUser = getSystemUserOrDummy();

        for (String line : logOutput.split("\n")) {
            String[] parts = line.split("\\|", 5);
            if (parts.length >= 5) {
                String hash = parts[0];
                String authorName = parts[1];
                String subject = parts[3];
                String dateStr = parts[4];
                
                list.add(ProjectCommitResponse.builder()
                        .id(UUID.nameUUIDFromBytes(hash.getBytes()))
                        .projectId(projectId)
                        .branchId(branchName)
                        .branchName(branchName)
                        .authorId(systemUser != null ? systemUser.getId() : UUID.randomUUID())
                        .authorName(authorName)
                        .message(subject)
                        .committedAt(Instant.from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(dateStr)))
                        .build());
            }
        }
        return list;
    }

    // ========== MERGE REQUEST OPERATIONS ==========

    @Transactional
    public MergeRequest createMergeRequest(UUID projectId, String sourceBranch, String targetBranch,
                                           UUID userId, String title, String description) {
        Project project = findProject(projectId);
        User author = findUser(userId);

        if (sourceBranch.equals(targetBranch)) {
            throw new IllegalArgumentException("Source and target branches cannot be the same");
        }

        MergeRequest mr = new MergeRequest(project, sourceBranch, targetBranch, author, title);
        mr.setDescription(description);
        return mergeRequestRepository.save(mr);
    }

    @Transactional(readOnly = true)
    public List<MergeRequest> getMergeRequests(UUID projectId) {
        return mergeRequestRepository.findByProject_IdOrderByCreatedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public List<MergeRequest> getOpenMergeRequests(UUID projectId) {
        return mergeRequestRepository.findByProject_IdAndStatusOrderByCreatedAtDesc(projectId, MergeRequestStatus.OPEN);
    }

    @Transactional
    public MergeRequest updateMergeRequestStatus(UUID mergeRequestId, MergeRequestStatus newStatus, UUID reviewerId) {
        MergeRequest mr = mergeRequestRepository.findById(mergeRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Merge request not found"));

        if (mr.getStatus() == MergeRequestStatus.MERGED || mr.getStatus() == MergeRequestStatus.CLOSED) {
            throw new IllegalStateException("Cannot update a " + mr.getStatus() + " merge request");
        }

        User reviewer = findUser(reviewerId);
        mr.setReviewer(reviewer);
        mr.setStatus(newStatus);
        mr.setUpdatedAt(Instant.now());

        if (newStatus == MergeRequestStatus.MERGED) {
            mr.setMergedAt(Instant.now());
            log.info("Merge request {} merged by {}", mergeRequestId, reviewerId);
            // Optionally, we could run git merge here for real git integration
            runGitCommand(mr.getProject().getId(), "checkout", mr.getTargetBranch());
            runGitCommand(mr.getProject().getId(), "merge", mr.getSourceBranch());
        }

        return mergeRequestRepository.save(mr);
    }

    // ========== HELPERS ==========

    private Project findProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
    
    private User getSystemUserOrDummy() {
        return userRepository.findAll().stream().findFirst().orElse(null);
    }
}

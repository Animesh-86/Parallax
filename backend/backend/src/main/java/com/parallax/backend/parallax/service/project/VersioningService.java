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
import com.parallax.backend.parallax.service.file.FileService;
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
    private final FileService fileService;

    private final java.util.concurrent.ConcurrentMap<UUID, Object> projectLocks = new java.util.concurrent.ConcurrentHashMap<>();

    private Object getProjectLock(UUID projectId) {
        return projectLocks.computeIfAbsent(projectId, k -> new Object());
    }

    // ========== GIT RUNNER ==========
    
    private String runGitCommand(UUID projectId, String... args) {
        synchronized (getProjectLock(projectId)) {
        Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());
        if (!Files.exists(projectRoot)) {
            return "";
        }
        
        List<String> command = new ArrayList<>();
        command.add("git");
        command.addAll(Arrays.asList(args));
        
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.environment().put("GIT_TERMINAL_PROMPT", "0");
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
    }

    private void ensureGitInitialized(UUID projectId) {
        synchronized (getProjectLock(projectId)) {
            Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());
            Path gitDir = projectRoot.resolve(".git");
            if (!Files.exists(gitDir)) {
                runGitCommand(projectId, "init");
                runGitCommand(projectId, "config", "user.name", "Parallax IDE");
                runGitCommand(projectId, "config", "user.email", "bot@parallax.local");
                runGitCommand(projectId, "checkout", "-b", "main");
            }
        }
    }

    public String getGitDiff(UUID projectId) {
        ensureGitInitialized(projectId);
        return runGitCommand(projectId, "diff", "HEAD");
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
        fileService.syncDbFromDisk(projectId);
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
        Instant createdAt = Instant.now();
        String dateStr = runGitCommand(projectId, "log", "-1", "--format=%aI", name);
        if (dateStr != null && !dateStr.isBlank() && !dateStr.startsWith("fatal:")) {
            try {
                createdAt = Instant.from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(dateStr.trim()));
            } catch (Exception ignored) {}
        }
        return ProjectBranchResponse.builder()
                .id(name) // Using name as ID
                .projectId(projectId)
                .name(name)
                .isMain("main".equals(name) || "master".equals(name))
                .createdById(user != null ? user.getId() : UUID.randomUUID())
                .createdByName(user != null ? user.getFullName() : "System")
                .createdAt(createdAt)
                .build();
    }

    // ========== COMMIT OPERATIONS ==========

    public ProjectCommitResponse createCommit(UUID projectId, String branchName, UUID userId, String message) {
        ensureGitInitialized(projectId);
        Project project = findProject(projectId);
        User user = findUser(userId);

        // Checkout the branch
        runGitCommand(projectId, "checkout", branchName);
        fileService.syncDbFromDisk(projectId);
        
        // Configure user for commit
        runGitCommand(projectId, "config", "user.name", user.getFullName());
        runGitCommand(projectId, "config", "user.email", user.getEmail());
        
        // Add and check status
        runGitCommand(projectId, "add", ".");
        String status = runGitCommand(projectId, "status", "--porcelain");
        if (status.isBlank()) {
            throw new IllegalStateException("Nothing to commit.");
        }
        
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

    private static final java.util.regex.Pattern GITHUB_URL_PATTERN =
            java.util.regex.Pattern.compile("^https://github\\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+(\\.git)?$");

    private void validateGithubUrl(String url) {
        if (url == null || !GITHUB_URL_PATTERN.matcher(url).matches()) {
            throw new IllegalArgumentException("Invalid repository URL. Only standard https://github.com/owner/repo URLs are allowed.");
        }
    }

    private void setupRemoteOrigin(UUID projectId, String url) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("You must be logged in to sync code.");
        }
        
        UUID userId = UUID.fromString(auth.getName());
        com.parallax.backend.parallax.entity.auth.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        String githubPat = user.getGithubAccessToken();

        String cleanUrl = url.trim();
        if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
        if (cleanUrl.endsWith(".git")) cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 4);
        
        String[] parts = cleanUrl.split("/");
        if (parts.length < 2) throw new IllegalStateException("Invalid GitHub URL");
        String repo = parts[parts.length - 1];
        String owner = parts[parts.length - 2];
        
        String authUrl;
        if (githubPat == null || githubPat.isBlank()) {
            authUrl = String.format("https://github.com/%s/%s.git", owner, repo);
        } else {
            authUrl = String.format("https://%s@github.com/%s/%s.git", githubPat, owner, repo);
        }
        
        String remotes = runGitCommand(projectId, "remote");
        if (!remotes.contains("origin")) {
            runGitCommand(projectId, "remote", "add", "origin", authUrl);
        } else {
            runGitCommand(projectId, "remote", "set-url", "origin", authUrl);
        }
    }

    public void pushToRemote(UUID projectId, String branchName) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        String url = project.getGithubRepoUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Project is not linked to a GitHub repository. Please set a remote URL first.");
        }
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            UUID userId = UUID.fromString(auth.getName());
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && (user.getGithubAccessToken() == null || user.getGithubAccessToken().isBlank())) {
                throw new IllegalStateException("GitHub integration is not configured. Please connect your GitHub account in your Profile to push code.");
            }
        }
        
        validateGithubUrl(url.trim());
        setupRemoteOrigin(projectId, url);
        
        String output = runGitCommand(projectId, "push", "-u", "origin", branchName);
        if (output.toLowerCase().contains("error:") || output.toLowerCase().contains("fatal:")) {
            log.error("Git push failed: {}", output);
            throw new IllegalStateException("Failed to push to GitHub: " + output);
        }
    }

    public void pullFromRemote(UUID projectId, String branchName) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        String url = project.getGithubRepoUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Project is not linked to a GitHub repository.");
        }
        
        validateGithubUrl(url.trim());
        setupRemoteOrigin(projectId, url);
        
        runGitCommand(projectId, "fetch", "origin");
        String output = runGitCommand(projectId, "pull", "origin", branchName, "--no-edit");
        if (output.toLowerCase().contains("error:") || output.toLowerCase().contains("fatal:") || output.toLowerCase().contains("conflict")) {
            log.error("Git pull failed: {}", output);
            throw new IllegalStateException("Failed to pull from GitHub: " + output);
        }
        
        fileService.syncDbFromDisk(projectId);
    }

    @Transactional
    public void setRemoteUrl(UUID projectId, String url) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL cannot be empty");
        }
        validateGithubUrl(url.trim());
        project.setGithubRepoUrl(url.trim());
        projectRepository.save(project);

        try {
            ensureGitInitialized(projectId);
            setupRemoteOrigin(projectId, url);
            String fetchOutput = runGitCommand(projectId, "fetch", "origin");
            if (fetchOutput.toLowerCase().contains("fatal:") || fetchOutput.toLowerCase().contains("error:")) {
                throw new IllegalStateException("Failed to fetch repository. Is the repository private? Connect GitHub account in Profile. Details: " + fetchOutput);
            }
            
            String commitCountStr = runGitCommand(projectId, "rev-list", "--count", "HEAD");
            int commitCount = 0;
            try { commitCount = Integer.parseInt(commitCountStr.trim()); } catch(Exception ignored){}
            
            if (commitCount <= 1) {
                String branches = runGitCommand(projectId, "branch", "-r");
                if (branches.contains("origin/main")) {
                    runGitCommand(projectId, "reset", "--hard", "origin/main");
                } else if (branches.contains("origin/master")) {
                    runGitCommand(projectId, "reset", "--hard", "origin/master");
                }
                fileService.syncDbFromDisk(projectId);
            } else {
                throw new IllegalStateException("Project has local commits. Please pull from the remote repository first to sync files.");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to initial sync repo on connect", e);
            throw new RuntimeException(e.getMessage());
        }
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

        Set<String> unpushedHashes = new java.util.HashSet<>();
        String unpushedLog = runGitCommand(projectId, "log", branchName, "--not", "--remotes", "--format=%H");
        if (!unpushedLog.isBlank() && !unpushedLog.startsWith("fatal:")) {
            for (String h : unpushedLog.split("\n")) {
                unpushedHashes.add(h.trim());
            }
        }

        for (String line : logOutput.split("\n")) {
            String[] parts = line.split("\\|", 5);
            if (parts.length >= 5) {
                String hash = parts[0];
                String authorName = parts[1];
                String authorEmail = parts[2];
                String subject = parts[3];
                String dateStr = parts[4];
                
                User author = userRepository.findByEmail(authorEmail).orElse(null);
                
                list.add(ProjectCommitResponse.builder()
                        .id(UUID.nameUUIDFromBytes(hash.getBytes()))
                        .projectId(projectId)
                        .branchId(branchName)
                        .branchName(branchName)
                        .authorId(author != null ? author.getId() : (systemUser != null ? systemUser.getId() : UUID.randomUUID()))
                        .authorName(authorName)
                        .message(subject)
                        .committedAt(Instant.from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(dateStr)))
                        .pushed(!unpushedHashes.contains(hash))
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

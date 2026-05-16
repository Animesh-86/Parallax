package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.project.*;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.project.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.parallax.backend.parallax.service.gamification.GamificationEvent;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VersioningService {

    private static final Logger log = LoggerFactory.getLogger(VersioningService.class);

    private final ProjectRepository projectRepository;
    private final ProjectBranchRepository branchRepository;
    private final ProjectCommitRepository commitRepository;
    private final MergeRequestRepository mergeRequestRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ========== BRANCH OPERATIONS ==========

    /**
     * Ensure a project has a "main" branch. Called when a project is first created
     * or when versioning is first accessed.
     */
    @Transactional
    public ProjectBranch ensureMainBranch(UUID projectId, UUID userId) {
        return branchRepository.findByProject_IdAndIsMainTrue(projectId)
                .orElseGet(() -> {
                    Project project = findProject(projectId);
                    User user = findUser(userId);
                    ProjectBranch main = new ProjectBranch(project, "main", user, true);
                    log.info("Created main branch for project {}", projectId);
                    return branchRepository.save(main);
                });
    }

    @Transactional(readOnly = true)
    public List<ProjectBranch> getBranches(UUID projectId) {
        return branchRepository.findByProject_IdOrderByCreatedAtDesc(projectId);
    }

    @Transactional
    public ProjectBranch createBranch(UUID projectId, String name, UUID userId) {
        Project project = findProject(projectId);
        User user = findUser(userId);

        if (branchRepository.existsByProject_IdAndName(projectId, name)) {
            throw new IllegalArgumentException("Branch '" + name + "' already exists");
        }

        ProjectBranch branch = new ProjectBranch(project, name, user, false);
        return branchRepository.save(branch);
    }

    // ========== COMMIT OPERATIONS ==========

    @Transactional
    public ProjectCommit createCommit(UUID projectId, UUID branchId, UUID userId, String message) {
        Project project = findProject(projectId);
        ProjectBranch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));
        User user = findUser(userId);

        if (!branch.getProject().getId().equals(projectId)) {
            throw new IllegalStateException("Branch does not belong to this project");
        }

        ProjectCommit commit = new ProjectCommit(project, branch, user, message);
        branch.setUpdatedAt(Instant.now());
        branchRepository.save(branch);

        ProjectCommit savedCommit = commitRepository.save(commit);

        eventPublisher.publishEvent(new GamificationEvent(
                this, userId, GamificationEvent.EventType.COMMIT, "Committed to " + branch.getName() + " in project " + project.getName(), savedCommit.getId()
        ));

        return savedCommit;
    }

    @Transactional(readOnly = true)
    public List<ProjectCommit> getCommits(UUID projectId) {
        return commitRepository.findByProject_IdOrderByCommittedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public List<ProjectCommit> getBranchCommits(UUID branchId) {
        return commitRepository.findByBranch_IdOrderByCommittedAtDesc(branchId);
    }

    // ========== MERGE REQUEST OPERATIONS ==========

    @Transactional
    public MergeRequest createMergeRequest(UUID projectId, UUID sourceBranchId, UUID targetBranchId,
                                           UUID userId, String title, String description) {
        Project project = findProject(projectId);
        ProjectBranch source = branchRepository.findById(sourceBranchId)
                .orElseThrow(() -> new ResourceNotFoundException("Source branch not found"));
        ProjectBranch target = branchRepository.findById(targetBranchId)
                .orElseThrow(() -> new ResourceNotFoundException("Target branch not found"));
        User author = findUser(userId);

        if (source.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Source and target branches cannot be the same");
        }

        MergeRequest mr = new MergeRequest(project, source, target, author, title);
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
}

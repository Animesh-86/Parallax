package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.project.*;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.project.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class VersioningServiceIntegrationTest {

    @Autowired
    private VersioningService versioningService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectBranchRepository branchRepository;

    @Autowired
    private ProjectCommitRepository commitRepository;

    @Autowired
    private MergeRequestRepository mergeRequestRepository;

    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        // Create a test user
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        testUser = new User(
                "Test User",
                "testuser_" + uniqueSuffix,
                "test_" + uniqueSuffix + "@example.com",
                "hashed_password",
                "LOCAL"
        );
        testUser = userRepository.save(testUser);

        // Create a test project
        testProject = new Project(UUID.randomUUID(), "Test Project", "javascript");
        testProject.setOwner(testUser);
        testProject = projectRepository.save(testProject);
    }

    @Test
    void testVersioningLifecycle() {
        // 1. Ensure main branch exists
        ProjectBranch mainBranch = versioningService.ensureMainBranch(testProject.getId(), testUser.getId());
        assertNotNull(mainBranch);
        assertEquals("main", mainBranch.getName());
        assertTrue(mainBranch.isMain());

        // 2. Create a feature branch
        ProjectBranch featureBranch = versioningService.createBranch(testProject.getId(), "feature-1", testUser.getId());
        assertNotNull(featureBranch);
        assertEquals("feature-1", featureBranch.getName());
        assertFalse(featureBranch.isMain());

        // 3. Create a commit on feature branch
        ProjectCommit commit = versioningService.createCommit(
                testProject.getId(), 
                featureBranch.getId(), 
                testUser.getId(), 
                "Add new feature"
        );
        assertNotNull(commit);
        assertEquals("Add new feature", commit.getMessage());
        assertEquals(featureBranch.getId(), commit.getBranch().getId());

        // 4. List commits for the project
        List<ProjectCommit> projectCommits = versioningService.getCommits(testProject.getId());
        assertEquals(1, projectCommits.size());
        assertEquals(commit.getId(), projectCommits.get(0).getId());

        // 5. Create a Merge Request
        MergeRequest mr = versioningService.createMergeRequest(
                testProject.getId(),
                featureBranch.getId(),
                mainBranch.getId(),
                testUser.getId(),
                "Merge feature-1 to main",
                "This adds the awesome new feature"
        );
        assertNotNull(mr);
        assertEquals(MergeRequestStatus.OPEN, mr.getStatus());
        assertEquals("Merge feature-1 to main", mr.getTitle());

        // 6. Approve and Merge
        MergeRequest mergedMr = versioningService.updateMergeRequestStatus(
                mr.getId(),
                MergeRequestStatus.MERGED,
                testUser.getId()
        );
        assertEquals(MergeRequestStatus.MERGED, mergedMr.getStatus());
        assertNotNull(mergedMr.getMergedAt());
        assertEquals(testUser.getId(), mergedMr.getReviewer().getId());
    }

    @Test
    void testDuplicateBranchThrowsException() {
        versioningService.createBranch(testProject.getId(), "duplicate", testUser.getId());
        
        assertThrows(IllegalArgumentException.class, () -> {
            versioningService.createBranch(testProject.getId(), "duplicate", testUser.getId());
        });
    }

    @Test
    void testBranchMismatchThrowsException() {
        // Create another project
        Project otherProject = new Project(UUID.randomUUID(), "Other Project", "java");
        otherProject.setOwner(testUser);
        otherProject = projectRepository.save(otherProject);
        
        ProjectBranch otherBranch = versioningService.ensureMainBranch(otherProject.getId(), testUser.getId());

        // Try to commit to otherProject's branch using testProject's ID
        assertThrows(IllegalStateException.class, () -> {
            versioningService.createCommit(testProject.getId(), otherBranch.getId(), testUser.getId(), "Malicious commit");
        });
    }
}

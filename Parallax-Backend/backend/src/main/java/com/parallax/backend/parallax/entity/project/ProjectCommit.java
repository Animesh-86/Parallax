package com.parallax.backend.parallax.entity.project;

import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_commits", indexes = {
        @Index(name = "idx_commit_project", columnList = "project_id"),
        @Index(name = "idx_commit_branch", columnList = "branch_id"),
        @Index(name = "idx_commit_timestamp", columnList = "committed_at")
})
public class ProjectCommit {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private ProjectBranch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "committed_at", nullable = false)
    private Instant committedAt = Instant.now();

    @Column(name = "snapshot_metadata", columnDefinition = "TEXT")
    private String snapshotMetadata;

    public ProjectCommit() {}

    public ProjectCommit(Project project, ProjectBranch branch, User author, String message) {
        this.project = project;
        this.branch = branch;
        this.author = author;
        this.message = message;
        this.committedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public ProjectBranch getBranch() { return branch; }
    public void setBranch(ProjectBranch branch) { this.branch = branch; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCommittedAt() { return committedAt; }
    public void setCommittedAt(Instant committedAt) { this.committedAt = committedAt; }

    public String getSnapshotMetadata() { return snapshotMetadata; }
    public void setSnapshotMetadata(String snapshotMetadata) { this.snapshotMetadata = snapshotMetadata; }
}

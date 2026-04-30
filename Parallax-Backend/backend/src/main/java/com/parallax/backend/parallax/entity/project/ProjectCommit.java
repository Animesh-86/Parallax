package com.parallax.backend.parallax.entity.project;

import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_commits", indexes = {
        @Index(name = "idx_commit_project", columnList = "project_id"),
        @Index(name = "idx_commit_branch", columnList = "branch_id"),
        @Index(name = "idx_commit_timestamp", columnList = "committed_at")
})
@Getter
@Setter
@NoArgsConstructor
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

    /**
     * Stores a JSON snapshot of file paths and their content hashes at the time of commit.
     * This allows us to reconstruct or diff project state without duplicating file storage.
     */
    @Column(name = "snapshot_metadata", columnDefinition = "TEXT")
    private String snapshotMetadata;

    public ProjectCommit(Project project, ProjectBranch branch, User author, String message) {
        this.project = project;
        this.branch = branch;
        this.author = author;
        this.message = message;
        this.committedAt = Instant.now();
    }
}

package com.parallax.backend.parallax.entity.project;

import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "merge_requests", indexes = {
        @Index(name = "idx_mr_project", columnList = "project_id"),
        @Index(name = "idx_mr_status", columnList = "status"),
        @Index(name = "idx_mr_author", columnList = "author_id")
})
@Getter
@Setter
@NoArgsConstructor
public class MergeRequest {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_branch_id", nullable = false)
    private ProjectBranch sourceBranch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_branch_id", nullable = false)
    private ProjectBranch targetBranch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MergeRequestStatus status = MergeRequestStatus.OPEN;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "merged_at")
    private Instant mergedAt;

    public MergeRequest(Project project, ProjectBranch sourceBranch, ProjectBranch targetBranch, User author, String title) {
        this.project = project;
        this.sourceBranch = sourceBranch;
        this.targetBranch = targetBranch;
        this.author = author;
        this.title = title;
        this.status = MergeRequestStatus.OPEN;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}

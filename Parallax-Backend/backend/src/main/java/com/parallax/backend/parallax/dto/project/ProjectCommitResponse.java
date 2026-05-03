package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.entity.project.ProjectCommit;
import java.time.Instant;
import java.util.UUID;

public class ProjectCommitResponse {
    private UUID id;
    private UUID projectId;
    private UUID branchId;
    private String branchName;
    private UUID authorId;
    private String authorName;
    private String message;
    private Instant committedAt;

    public ProjectCommitResponse() {}

    public ProjectCommitResponse(UUID id, UUID projectId, UUID branchId, String branchName, UUID authorId, String authorName, String message, Instant committedAt) {
        this.id = id;
        this.projectId = projectId;
        this.branchId = branchId;
        this.branchName = branchName;
        this.authorId = authorId;
        this.authorName = authorName;
        this.message = message;
        this.committedAt = committedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getBranchId() { return branchId; }
    public void setBranchId(UUID branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCommittedAt() { return committedAt; }
    public void setCommittedAt(Instant committedAt) { this.committedAt = committedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private UUID projectId;
        private UUID branchId;
        private String branchName;
        private UUID authorId;
        private String authorName;
        private String message;
        private Instant committedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder projectId(UUID projectId) { this.projectId = projectId; return this; }
        public Builder branchId(UUID branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder authorId(UUID authorId) { this.authorId = authorId; return this; }
        public Builder authorName(String authorName) { this.authorName = authorName; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder committedAt(Instant committedAt) { this.committedAt = committedAt; return this; }

        public ProjectCommitResponse build() {
            return new ProjectCommitResponse(id, projectId, branchId, branchName, authorId, authorName, message, committedAt);
        }
    }

    public static ProjectCommitResponse from(ProjectCommit commit) {
        return ProjectCommitResponse.builder()
                .id(commit.getId())
                .projectId(commit.getProject().getId())
                .branchId(commit.getBranch().getId())
                .branchName(commit.getBranch().getName())
                .authorId(commit.getAuthor().getId())
                .authorName(commit.getAuthor().getFullName())
                .message(commit.getMessage())
                .committedAt(commit.getCommittedAt())
                .build();
    }
}

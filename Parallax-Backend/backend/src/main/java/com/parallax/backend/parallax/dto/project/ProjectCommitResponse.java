package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.entity.project.ProjectCommit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ProjectCommitResponse {
    private UUID id;
    private UUID projectId;
    private UUID branchId;
    private String branchName;
    private UUID authorId;
    private String authorName;
    private String message;
    private Instant committedAt;

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

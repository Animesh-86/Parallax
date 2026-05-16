package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.entity.project.MergeRequest;
import com.parallax.backend.parallax.entity.project.MergeRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class MergeRequestResponse {
    private UUID id;
    private UUID projectId;
    private UUID sourceBranchId;
    private String sourceBranchName;
    private UUID targetBranchId;
    private String targetBranchName;
    private UUID authorId;
    private String authorName;
    private UUID reviewerId;
    private String reviewerName;
    private String title;
    private String description;
    private MergeRequestStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant mergedAt;

    public static MergeRequestResponse from(MergeRequest mr) {
        return MergeRequestResponse.builder()
                .id(mr.getId())
                .projectId(mr.getProject().getId())
                .sourceBranchId(mr.getSourceBranch().getId())
                .sourceBranchName(mr.getSourceBranch().getName())
                .targetBranchId(mr.getTargetBranch().getId())
                .targetBranchName(mr.getTargetBranch().getName())
                .authorId(mr.getAuthor().getId())
                .authorName(mr.getAuthor().getFullName())
                .reviewerId(mr.getReviewer() != null ? mr.getReviewer().getId() : null)
                .reviewerName(mr.getReviewer() != null ? mr.getReviewer().getFullName() : null)
                .title(mr.getTitle())
                .description(mr.getDescription())
                .status(mr.getStatus())
                .createdAt(mr.getCreatedAt())
                .updatedAt(mr.getUpdatedAt())
                .mergedAt(mr.getMergedAt())
                .build();
    }
}

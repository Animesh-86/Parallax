package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.entity.project.ProjectBranch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ProjectBranchResponse {
    private UUID id;
    private UUID projectId;
    private String name;
    private boolean isMain;
    private UUID createdById;
    private String createdByName;
    private Instant createdAt;

    public static ProjectBranchResponse from(ProjectBranch branch) {
        return ProjectBranchResponse.builder()
                .id(branch.getId())
                .projectId(branch.getProject().getId())
                .name(branch.getName())
                .isMain(branch.isMain())
                .createdById(branch.getCreatedBy().getId())
                .createdByName(branch.getCreatedBy().getFullName())
                .createdAt(branch.getCreatedAt())
                .build();
    }
}

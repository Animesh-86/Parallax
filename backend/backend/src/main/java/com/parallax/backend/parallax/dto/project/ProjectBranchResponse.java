package com.parallax.backend.parallax.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ProjectBranchResponse {
    private String id;
    private UUID projectId;
    private String name;
    private boolean isMain;
    private UUID createdById;
    private String createdByName;
    private Instant createdAt;

}

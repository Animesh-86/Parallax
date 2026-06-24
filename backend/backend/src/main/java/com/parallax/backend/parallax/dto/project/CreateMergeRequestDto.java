package com.parallax.backend.parallax.dto.project;

import jakarta.validation.constraints.NotBlank;

public record CreateMergeRequestDto(
        @NotBlank String sourceBranchId,
        @NotBlank String targetBranchId,
        @NotBlank String title,
        String description
) {}

package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.entity.project.MergeRequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateMergeRequestStatusDto(
        @NotNull MergeRequestStatus status
) {}

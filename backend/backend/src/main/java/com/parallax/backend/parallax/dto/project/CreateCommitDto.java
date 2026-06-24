package com.parallax.backend.parallax.dto.project;

import jakarta.validation.constraints.NotBlank;

public record CreateCommitDto(
        @NotBlank String branchId,
        @NotBlank String message
) {}

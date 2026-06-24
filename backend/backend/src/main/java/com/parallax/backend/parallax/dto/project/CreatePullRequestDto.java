package com.parallax.backend.parallax.dto.project;

import jakarta.validation.constraints.NotBlank;

public record CreatePullRequestDto(
        @NotBlank String branchName,
        @NotBlank String title,
        @NotBlank String message
) {}

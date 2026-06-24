package com.parallax.backend.parallax.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ToggleExtensionDto(
        @NotBlank String extensionId,
        @NotNull Boolean enabled
) {}

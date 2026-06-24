package com.parallax.backend.parallax.dto.project;

import jakarta.validation.constraints.NotBlank;

public record SetRemoteUrlDto(
        @NotBlank String url
) {}

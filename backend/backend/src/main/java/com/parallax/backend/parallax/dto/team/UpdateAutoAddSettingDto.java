package com.parallax.backend.parallax.dto.team;

import jakarta.validation.constraints.NotNull;

public record UpdateAutoAddSettingDto(
        @NotNull Boolean autoAddMembersToProjects
) {}

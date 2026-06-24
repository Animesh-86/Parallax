package com.parallax.backend.parallax.dto.room;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferHostDto(
        @NotNull UUID newHostId
) {}

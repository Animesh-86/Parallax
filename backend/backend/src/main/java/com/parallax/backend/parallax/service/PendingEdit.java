package com.parallax.backend.parallax.service;

import java.util.UUID;

public record PendingEdit(
        UUID projectId,
        String path,
        String content,
        UUID userId
) {}

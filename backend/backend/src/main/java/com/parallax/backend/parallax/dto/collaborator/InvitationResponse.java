package com.parallax.backend.parallax.dto.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.InvitationStatus;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
        UUID invitationId,
        UUID projectId,
        String projectName,
        String inviterEmail,
        CollaboratorRole role,
        InvitationStatus status,
        Instant invitedAt
) {}

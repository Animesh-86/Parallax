package com.parallax.backend.parallax.dto.team;

import java.time.Instant;
import java.util.UUID;

import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;

public record TeamResponse(
        UUID id,
        String name,
        String description,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt,
        TeamMemberRole myRole,
        TeamMemberStatus myStatus,
        long activeMembers,
        long pendingInvites
) {
}

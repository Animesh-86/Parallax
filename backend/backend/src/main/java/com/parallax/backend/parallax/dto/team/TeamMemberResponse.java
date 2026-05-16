package com.parallax.backend.parallax.dto.team;

import java.time.Instant;
import java.util.UUID;

import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;

public record TeamMemberResponse(
        UUID userId,
        String email,
        String fullName,
        String avatarUrl,
        TeamMemberRole role,
        TeamMemberStatus status,
        boolean isOnline,
        Instant invitedAt,
        Instant joinedAt
) {
}

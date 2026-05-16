package com.parallax.backend.parallax.service.team;

import java.util.List;
import java.util.UUID;

import com.parallax.backend.parallax.dto.team.CreateTeamRequest;
import com.parallax.backend.parallax.dto.team.InviteTeamMemberRequest;
import com.parallax.backend.parallax.dto.team.TeamMemberResponse;
import com.parallax.backend.parallax.dto.team.TeamResponse;

public interface TeamService {
    TeamResponse createTeam(CreateTeamRequest request, UUID requesterId);

    List<TeamResponse> getMyTeams(UUID requesterId);

    TeamResponse getTeam(UUID teamId, UUID requesterId);

    TeamMemberResponse inviteMember(UUID teamId, UUID requesterId, InviteTeamMemberRequest request);

    List<TeamMemberResponse> getTeamMembers(UUID teamId, UUID requesterId);

    void acceptInvite(UUID teamId, UUID requesterId);

    void rejectInvite(UUID teamId, UUID requesterId);

    void removeMember(UUID teamId, UUID requesterId, UUID memberId);

    TeamResponse updateTeam(UUID teamId, UUID requesterId, CreateTeamRequest request);

    void deleteTeam(UUID teamId, UUID requesterId);
}

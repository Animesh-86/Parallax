package com.parallax.backend.parallax.service.team;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parallax.backend.parallax.dto.team.CreateTeamRequest;
import com.parallax.backend.parallax.dto.team.InviteTeamMemberRequest;
import com.parallax.backend.parallax.dto.team.TeamMemberResponse;
import com.parallax.backend.parallax.dto.team.TeamResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
import com.parallax.backend.parallax.entity.collaborator.ProjectCollaborator;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.team.Team;
import com.parallax.backend.parallax.entity.team.TeamMember;
import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.collaborator.ProjectCollaboratorRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.repository.team.TeamMemberRepository;
import com.parallax.backend.parallax.repository.team.TeamRepository;
import com.parallax.backend.parallax.store.SessionRegistry;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final SessionRegistry sessionRegistry;
    private final ProjectRepository projectRepository;
    private final ProjectCollaboratorRepository collaboratorRepository;

    @Override
    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request, UUID requesterId) {
        User owner = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));

        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.length() < 2) {
            throw new IllegalArgumentException("Team name must be at least 2 characters");
        }

        Team team = new Team();
        team.setName(name);
        team.setDescription(normalizeDescription(request.getDescription()));
        team.setOwner(owner);
        team.setCreatedAt(Instant.now());
        team.setUpdatedAt(Instant.now());
        team = teamRepository.save(team);

        TeamMember ownerMembership = new TeamMember(team, owner, TeamMemberRole.OWNER, TeamMemberStatus.ACTIVE);
        ownerMembership.setJoinedAt(Instant.now());
        ownerMembership.setInvitedAt(Instant.now());
        teamMemberRepository.save(ownerMembership);

        return toTeamResponse(team, ownerMembership);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamResponse> getMyTeams(UUID requesterId) {
        List<Team> owned = teamRepository.findByOwner_IdOrderByUpdatedAtDesc(requesterId);
        List<TeamMember> memberships = teamMemberRepository.findByUser_Id(requesterId);

        LinkedHashMap<UUID, Team> merged = new LinkedHashMap<>();
        for (Team team : owned) {
            merged.put(team.getId(), team);
        }
        for (TeamMember membership : memberships) {
            merged.put(membership.getTeam().getId(), membership.getTeam());
        }

        List<TeamResponse> responses = new ArrayList<>();
        for (Team team : merged.values()) {
            TeamMember myMembership = teamMemberRepository.findByTeam_IdAndUser_Id(team.getId(), requesterId).orElse(null);
            if (team.getOwner().getId().equals(requesterId) && myMembership == null) {
                TeamMember syntheticOwner = new TeamMember();
                syntheticOwner.setRole(TeamMemberRole.OWNER);
                syntheticOwner.setStatus(TeamMemberStatus.ACTIVE);
                responses.add(toTeamResponse(team, syntheticOwner));
            } else if (myMembership != null) {
                responses.add(toTeamResponse(team, myMembership));
            }
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeam(UUID teamId, UUID requesterId) {
        Team team = findTeam(teamId);
        TeamMember myMembership = requireMembership(teamId, requesterId);
        return toTeamResponse(team, myMembership);
    }

    @Override
    @Transactional
    public TeamMemberResponse inviteMember(UUID teamId, UUID requesterId, InviteTeamMemberRequest request) {
        Team team = findTeam(teamId);
        TeamMember requesterMembership = requireMembership(teamId, requesterId);
        ensureCanManageMembers(team, requesterMembership, requesterId);

        User invitee = userRepository.findByEmail(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (invitee.getId().equals(requesterId)) {
            throw new IllegalArgumentException("You cannot invite yourself");
        }

        TeamMemberRole inviteRole = request.getRole() == null ? TeamMemberRole.MEMBER : request.getRole();
        if (inviteRole == TeamMemberRole.OWNER) {
            throw new IllegalArgumentException("Owner role cannot be assigned via invite");
        }

        TeamMember existing = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, invitee.getId()).orElse(null);
        if (existing != null) {
            if (existing.getStatus() == TeamMemberStatus.ACTIVE) {
                throw new IllegalStateException("User is already an active team member");
            }
            existing.setRole(inviteRole);
            existing.setStatus(TeamMemberStatus.INVITED);
            existing.setInvitedAt(Instant.now());
            existing.setJoinedAt(null);
            team.setUpdatedAt(Instant.now());
            teamRepository.save(team);
            TeamMember saved = teamMemberRepository.save(existing);
            return toMemberResponse(saved);
        }

        TeamMember member = new TeamMember(team, invitee, inviteRole, TeamMemberStatus.INVITED);
        member.setJoinedAt(null);
        team.setUpdatedAt(Instant.now());
        teamRepository.save(team);
        TeamMember saved = teamMemberRepository.save(member);
        return toMemberResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(UUID teamId, UUID requesterId) {
        requireMembership(teamId, requesterId);
        List<TeamMember> members = teamMemberRepository.findByTeam_Id(teamId);
        List<TeamMemberResponse> response = new ArrayList<>();
        for (TeamMember member : members) {
            response.add(toMemberResponse(member));
        }
        return response;
    }

    @Override
    @Transactional
    public void acceptInvite(UUID teamId, UUID requesterId) {
        TeamMember membership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Team membership not found"));

        if (membership.getStatus() != TeamMemberStatus.INVITED) {
            throw new IllegalStateException("You do not have a pending invitation for this team");
        }

        membership.setStatus(TeamMemberStatus.ACTIVE);
        membership.setJoinedAt(Instant.now());
        teamMemberRepository.save(membership);

        Team team = findTeam(teamId);
        team.setUpdatedAt(Instant.now());
        teamRepository.save(team);

        // Auto-sync: add new member to all team projects if setting is on
        if (team.isAutoAddMembersToProjects()) {
            autoSyncMemberToTeamProjects(team, membership.getUser());
        }
    }

    @Override
    @Transactional
    public void rejectInvite(UUID teamId, UUID requesterId) {
        TeamMember membership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Team membership not found"));

        if (membership.getStatus() != TeamMemberStatus.INVITED) {
            throw new IllegalStateException("You do not have a pending invitation for this team");
        }

        // Revoke any provisional project access granted during invite
        revokeProjectAccessForUser(teamId, requesterId);

        teamMemberRepository.delete(membership);

        Team team = findTeam(teamId);
        team.setUpdatedAt(Instant.now());
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public void removeMember(UUID teamId, UUID requesterId, UUID memberId) {
        Team team = findTeam(teamId);
        TeamMember requesterMembership = requireMembership(teamId, requesterId);
        ensureCanManageMembers(team, requesterMembership, requesterId);

        if (requesterId.equals(memberId)) {
            throw new IllegalArgumentException("You cannot remove yourself from the team");
        }

        User targetUser = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (team.getOwner().getId().equals(memberId)) {
            throw new IllegalStateException("You cannot remove the team owner");
        }

        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        // Cascade: revoke access from all team projects
        revokeProjectAccessForUser(teamId, memberId);

        teamMemberRepository.delete(member);
        team.setUpdatedAt(Instant.now());
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public TeamResponse updateTeam(UUID teamId, UUID requesterId, CreateTeamRequest request) {
        Team team = findTeam(teamId);

        if (!team.getOwner().getId().equals(requesterId)) {
            throw new SecurityException("Only the team owner can update the team");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String name = request.getName().trim();
            if (name.length() < 2) {
                throw new IllegalArgumentException("Team name must be at least 2 characters");
            }
            team.setName(name);
        }

        if (request.getDescription() != null) {
            team.setDescription(normalizeDescription(request.getDescription()));
        }

        team.setUpdatedAt(Instant.now());
        team = teamRepository.save(team);

        TeamMember ownerMembership = new TeamMember();
        ownerMembership.setRole(TeamMemberRole.OWNER);
        ownerMembership.setStatus(TeamMemberStatus.ACTIVE);
        return toTeamResponse(team, ownerMembership);
    }

    @Override
    @Transactional
    public void deleteTeam(UUID teamId, UUID requesterId) {
        Team team = findTeam(teamId);

        if (!team.getOwner().getId().equals(requesterId)) {
            throw new SecurityException("Only the team owner can delete the team");
        }

        // Safely unlink all projects from the team before deletion
        List<Project> teamProjects = projectRepository.findByTeam_Id(teamId);
        for (Project project : teamProjects) {
            project.setTeam(null);
            project.setUpdatedAt(Instant.now());
            projectRepository.save(project);
        }

        teamMemberRepository.deleteByTeam_Id(teamId);
        teamRepository.delete(team);
    }

    private Team findTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
    }

    private TeamMember requireMembership(UUID teamId, UUID userId) {
        Team team = findTeam(teamId);
        if (team.getOwner().getId().equals(userId)) {
            TeamMember ownerMembership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId).orElse(null);
            if (ownerMembership != null) {
                return ownerMembership;
            }
            TeamMember synthetic = new TeamMember();
            synthetic.setRole(TeamMemberRole.OWNER);
            synthetic.setStatus(TeamMemberStatus.ACTIVE);
            return synthetic;
        }

        TeamMember membership = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new SecurityException("You are not a team member"));

        if (membership.getStatus() == TeamMemberStatus.INVITED) {
            throw new SecurityException("Team invitation is pending acceptance");
        }

        return membership;
    }

    private void ensureCanManageMembers(Team team, TeamMember requesterMembership, UUID requesterId) {
        if (team.getOwner().getId().equals(requesterId)) {
            return;
        }
        Set<TeamMemberRole> allowed = new HashSet<>();
        allowed.add(TeamMemberRole.OWNER);
        allowed.add(TeamMemberRole.ADMIN);
        if (!allowed.contains(requesterMembership.getRole())) {
            throw new SecurityException("Only owner or admin can manage team members");
        }
    }

    private TeamResponse toTeamResponse(Team team, TeamMember myMembership) {
        long active = teamMemberRepository.countByTeam_IdAndStatus(team.getId(), TeamMemberStatus.ACTIVE);
        long pending = teamMemberRepository.countByTeam_IdAndStatus(team.getId(), TeamMemberStatus.INVITED);
        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getDescription(),
                team.getOwner().getId(),
                team.getCreatedAt(),
                team.getUpdatedAt(),
                myMembership.getRole(),
                myMembership.getStatus(),
                active,
                pending,
                team.isAutoAddMembersToProjects()
        );
    }

    private TeamMemberResponse toMemberResponse(TeamMember member) {
        User user = member.getUser();
        boolean online = sessionRegistry.isUserConnected(user.getId());
        return new TeamMemberResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                member.getRole(),
                member.getStatus(),
                online,
                member.getInvitedAt(),
                member.getJoinedAt()
        );
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > 300) {
            throw new IllegalArgumentException("Description cannot exceed 300 characters");
        }
        return trimmed;
    }

    /**
     * Maps a TeamMemberRole to a CollaboratorRole for RBAC sync.
     */
    private CollaboratorRole mapTeamRoleToProjectRole(TeamMemberRole teamRole) {
        return switch (teamRole) {
            case OWNER -> CollaboratorRole.OWNER;
            case ADMIN -> CollaboratorRole.ADMIN;
            case MEMBER -> CollaboratorRole.COLLABORATOR;
        };
    }

    /**
     * When a new member joins a team, add them to all projects belonging to that team
     * with a role derived from their team membership role.
     */
    public void autoSyncMemberToTeamProjects(Team team, User user) {
        TeamMember membership = teamMemberRepository.findByTeam_IdAndUser_Id(team.getId(), user.getId()).orElse(null);
        CollaboratorRole projectRole = (membership != null)
                ? mapTeamRoleToProjectRole(membership.getRole())
                : CollaboratorRole.COLLABORATOR;

        List<Project> teamProjects = projectRepository.findByTeam_Id(team.getId());
        for (Project project : teamProjects) {
            // Skip if already a collaborator
            if (collaboratorRepository.findByProjectIdAndUserId(project.getId(), user.getId()).isPresent()) {
                continue;
            }
            ProjectCollaborator collab = new ProjectCollaborator(project, user, projectRole);
            collab.setStatus(CollaboratorStatus.ACCEPTED);
            collab.setAcceptedAt(Instant.now());
            collaboratorRepository.save(collab);
        }
    }

    /**
     * When a project is linked to a team, add all active team members
     * with roles derived from their team membership roles.
     */
    public void syncAllTeamMembersToProject(Team team, Project project) {
        if (!team.isAutoAddMembersToProjects()) {
            return;
        }
        List<TeamMember> activeMembers = teamMemberRepository.findByTeam_IdAndStatus(team.getId(), TeamMemberStatus.ACTIVE);
        for (TeamMember member : activeMembers) {
            User user = member.getUser();
            // Skip if already a collaborator
            if (collaboratorRepository.findByProjectIdAndUserId(project.getId(), user.getId()).isPresent()) {
                continue;
            }
            CollaboratorRole projectRole = mapTeamRoleToProjectRole(member.getRole());
            ProjectCollaborator collab = new ProjectCollaborator(project, user, projectRole);
            collab.setStatus(CollaboratorStatus.ACCEPTED);
            collab.setAcceptedAt(Instant.now());
            collaboratorRepository.save(collab);
        }
    }

    /**
     * Revoke project access for a user across all projects belonging to a team.
     * Used when a member is removed or rejects an invite.
     */
    private void revokeProjectAccessForUser(UUID teamId, UUID userId) {
        List<Project> teamProjects = projectRepository.findByTeam_Id(teamId);
        for (Project project : teamProjects) {
            // Don't revoke access if the user is the project owner
            if (project.getOwner().getId().equals(userId)) {
                continue;
            }
            collaboratorRepository.findByProjectIdAndUserId(project.getId(), userId)
                    .ifPresent(collaboratorRepository::delete);
        }
    }

    /**
     * Get all projects belonging to a team.
     */
    @Transactional(readOnly = true)
    public List<Project> getTeamProjects(UUID teamId, UUID requesterId) {
        requireMembership(teamId, requesterId);
        return projectRepository.findByTeam_Id(teamId);
    }

    /**
     * Toggle autoAddMembersToProjects setting (owner/admin only).
     */
    @Transactional
    public TeamResponse updateAutoAddSetting(UUID teamId, UUID requesterId, boolean autoAdd) {
        Team team = findTeam(teamId);
        TeamMember requesterMembership = requireMembership(teamId, requesterId);
        ensureCanManageMembers(team, requesterMembership, requesterId);

        team.setAutoAddMembersToProjects(autoAdd);
        team.setUpdatedAt(Instant.now());
        team = teamRepository.save(team);

        return toTeamResponse(team, requesterMembership);
    }

    /**
     * Unlink a project from a team. The project continues to exist as a personal project.
     * Per design decision: team members RETAIN their collaborator access after unlinking.
     */
    @Transactional
    public void unlinkProjectFromTeam(UUID teamId, UUID projectId, UUID requesterId) {
        Team team = findTeam(teamId);
        TeamMember requesterMembership = requireMembership(teamId, requesterId);
        ensureCanManageMembers(team, requesterMembership, requesterId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (project.getTeam() == null || !project.getTeam().getId().equals(teamId)) {
            throw new IllegalStateException("Project is not linked to this team");
        }

        project.setTeam(null);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);

        team.setUpdatedAt(Instant.now());
        teamRepository.save(team);
    }
}

package com.parallax.backend.parallax.service.team;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parallax.backend.parallax.entity.team.TeamMember;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;
import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.team.TeamMemberRepository;

@Service
@Transactional(readOnly = true)
public class TeamPermissionService {

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    public void verifyMember(UUID teamId, UUID userId) {
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new RuntimeException("Access denied: Not a member of this team"));
        if (member.getStatus() != TeamMemberStatus.ACTIVE) {
            throw new RuntimeException("Access denied: Team invitation not accepted");
        }
    }

    public void verifyAdminOrOwner(UUID teamId, UUID userId) {
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new RuntimeException("Access denied: Not a member of this team"));
        if (member.getStatus() != TeamMemberStatus.ACTIVE) {
            throw new RuntimeException("Access denied: Team invitation not accepted");
        }
        if (member.getRole() != TeamMemberRole.ADMIN && member.getRole() != TeamMemberRole.OWNER) {
            throw new RuntimeException("Access denied: Requires Admin or Owner role");
        }
    }

    public boolean isMember(UUID teamId, UUID userId) {
        return teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .filter(m -> m.getStatus() == TeamMemberStatus.ACTIVE)
                .isPresent();
    }

    public TeamMemberRole getMemberRole(UUID teamId, UUID userId) {
        return teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .map(TeamMember::getRole)
                .orElse(null);
    }
}

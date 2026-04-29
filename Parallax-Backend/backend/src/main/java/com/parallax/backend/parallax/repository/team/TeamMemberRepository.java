package com.parallax.backend.parallax.repository.team;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.parallax.backend.parallax.entity.team.TeamMember;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    Optional<TeamMember> findByTeam_IdAndUser_Id(UUID teamId, UUID userId);

    List<TeamMember> findByTeam_Id(UUID teamId);

    List<TeamMember> findByUser_Id(UUID userId);

    List<TeamMember> findByUser_IdAndStatus(UUID userId, TeamMemberStatus status);

    List<TeamMember> findByTeam_IdAndStatus(UUID teamId, TeamMemberStatus status);

    long countByTeam_IdAndStatus(UUID teamId, TeamMemberStatus status);

    void deleteByTeam_Id(UUID teamId);
}

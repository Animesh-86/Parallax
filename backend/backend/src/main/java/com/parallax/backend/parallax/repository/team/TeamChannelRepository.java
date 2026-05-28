package com.parallax.backend.parallax.repository.team;

import com.parallax.backend.parallax.entity.team.TeamChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamChannelRepository extends JpaRepository<TeamChannel, UUID> {
    List<TeamChannel> findByTeamIdOrderByCreatedAtAsc(UUID teamId);
    boolean existsByTeamIdAndName(UUID teamId, String name);
    long countByTeamId(UUID teamId);
    java.util.Optional<TeamChannel> findFirstByTeamIdAndIsDefaultTrue(UUID teamId);
}

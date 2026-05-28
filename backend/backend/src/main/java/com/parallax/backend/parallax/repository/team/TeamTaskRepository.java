package com.parallax.backend.parallax.repository.team;

import com.parallax.backend.parallax.entity.team.TeamTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamTaskRepository extends JpaRepository<TeamTask, UUID> {
    List<TeamTask> findByTeamIdOrderByCreatedAtAsc(UUID teamId);
    void deleteByTeamId(UUID teamId);
}

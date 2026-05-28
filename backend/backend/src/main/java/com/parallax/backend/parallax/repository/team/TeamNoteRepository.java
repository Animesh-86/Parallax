package com.parallax.backend.parallax.repository.team;

import com.parallax.backend.parallax.entity.team.TeamNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamNoteRepository extends JpaRepository<TeamNote, UUID> {
    List<TeamNote> findByTeamIdOrderByUpdatedAtDesc(UUID teamId);
    void deleteByTeamId(UUID teamId);
}

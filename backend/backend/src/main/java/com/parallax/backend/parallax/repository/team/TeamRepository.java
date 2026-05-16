package com.parallax.backend.parallax.repository.team;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.parallax.backend.parallax.entity.team.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByOwner_IdOrderByUpdatedAtDesc(UUID ownerId);

    List<Team> findByIdInOrderByUpdatedAtDesc(Collection<UUID> ids);
}

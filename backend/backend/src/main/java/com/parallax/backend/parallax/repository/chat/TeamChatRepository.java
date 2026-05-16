package com.parallax.backend.parallax.repository.chat;

import com.parallax.backend.parallax.entity.chat.TeamChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TeamChatRepository extends JpaRepository<TeamChatMessage, UUID> {

    @Query("SELECT m FROM TeamChatMessage m WHERE m.teamId = :teamId ORDER BY m.createdAt DESC")
    List<TeamChatMessage> findLatestByTeam(@Param("teamId") UUID teamId, Pageable pageable);
}

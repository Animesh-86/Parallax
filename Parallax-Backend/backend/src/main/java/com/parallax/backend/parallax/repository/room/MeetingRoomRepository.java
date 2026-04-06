package com.parallax.backend.parallax.repository.room;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.parallax.backend.parallax.entity.room.MeetingRoom;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, UUID> {
    Optional<MeetingRoom> findByRoomCode(String roomCode);
    List<MeetingRoom> findByCreatedByAndIsActiveTrue(UUID createdBy);
    List<MeetingRoom> findByIdInAndIsActiveTrue(List<UUID> ids);
}

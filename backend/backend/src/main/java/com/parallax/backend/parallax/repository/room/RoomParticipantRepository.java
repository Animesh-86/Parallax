package com.parallax.backend.parallax.repository.room;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.parallax.backend.parallax.entity.room.RoomParticipant;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, UUID> {
    List<RoomParticipant> findByRoomId(UUID roomId);
    List<RoomParticipant> findByUserId(UUID userId);
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);
    void deleteByRoomId(UUID roomId);
}

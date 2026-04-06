package com.parallax.backend.parallax.entity.room;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "meeting_room_participants",
    uniqueConstraints = @UniqueConstraint(name = "uk_room_participant", columnNames = {"room_id", "user_id"})
)
public class RoomParticipant {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected RoomParticipant() {}

    public RoomParticipant(UUID roomId, UUID userId) {
        this.roomId = roomId;
        this.userId = userId;
        this.joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public UUID getUserId() { return userId; }
    public Instant getJoinedAt() { return joinedAt; }
}

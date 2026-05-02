package com.parallax.backend.parallax.entity.gamification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recent_activity")
public class RecentActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "activity_type", nullable = false)
    private String activityType;

    @Column(nullable = false)
    private String description;

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    protected RecentActivity() {}

    public RecentActivity(UUID userId, String activityType, String description, UUID relatedEntityId) {
        this.userId = userId;
        this.activityType = activityType;
        this.description = description;
        this.relatedEntityId = relatedEntityId;
        this.timestamp = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getActivityType() { return activityType; }
    public String getDescription() { return description; }
    public UUID getRelatedEntityId() { return relatedEntityId; }
    public Instant getTimestamp() { return timestamp; }
}

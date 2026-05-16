package com.parallax.backend.parallax.entity.gamification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_badges")
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false)
    private BadgeType badgeType;

    @Column(name = "awarded_at", nullable = false, updatable = false)
    private Instant awardedAt;

    protected UserBadge() {
        // JPA only
    }

    public UserBadge(UUID userId, BadgeType badgeType) {
        this.userId = userId;
        this.badgeType = badgeType;
        this.awardedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public BadgeType getBadgeType() { return badgeType; }
    public Instant getAwardedAt() { return awardedAt; }
}

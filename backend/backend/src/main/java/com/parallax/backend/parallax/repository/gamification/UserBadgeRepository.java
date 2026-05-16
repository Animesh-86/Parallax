package com.parallax.backend.parallax.repository.gamification;

import com.parallax.backend.parallax.entity.gamification.BadgeType;
import com.parallax.backend.parallax.entity.gamification.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID> {
    List<UserBadge> findByUserIdOrderByAwardedAtDesc(UUID userId);
    boolean existsByUserIdAndBadgeType(UUID userId, BadgeType badgeType);
}

package com.parallax.backend.parallax.repository.gamification;

import com.parallax.backend.parallax.entity.gamification.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {
}

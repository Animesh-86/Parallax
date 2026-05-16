package com.parallax.backend.parallax.repository.gamification;

import com.parallax.backend.parallax.entity.gamification.RecentActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RecentActivityRepository extends JpaRepository<RecentActivity, UUID> {
    List<RecentActivity> findTop20ByUserIdOrderByTimestampDesc(UUID userId);
}

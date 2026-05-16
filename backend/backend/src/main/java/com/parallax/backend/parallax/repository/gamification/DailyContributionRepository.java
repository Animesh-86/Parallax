package com.parallax.backend.parallax.repository.gamification;

import com.parallax.backend.parallax.entity.gamification.DailyContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyContributionRepository extends JpaRepository<DailyContribution, UUID> {
    Optional<DailyContribution> findByUserIdAndDate(UUID userId, LocalDate date);
    List<DailyContribution> findByUserIdOrderByDateAsc(UUID userId);
}

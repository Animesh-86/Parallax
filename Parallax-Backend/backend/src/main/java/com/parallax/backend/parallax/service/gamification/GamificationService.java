package com.parallax.backend.parallax.service.gamification;

import com.parallax.backend.parallax.entity.gamification.*;
import com.parallax.backend.parallax.repository.gamification.*;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class GamificationService {

    private final UserStatsRepository userStatsRepository;
    private final DailyContributionRepository dailyContributionRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final RecentActivityRepository recentActivityRepository;

    public GamificationService(UserStatsRepository userStatsRepository,
                               DailyContributionRepository dailyContributionRepository,
                               UserBadgeRepository userBadgeRepository,
                               RecentActivityRepository recentActivityRepository) {
        this.userStatsRepository = userStatsRepository;
        this.dailyContributionRepository = dailyContributionRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.recentActivityRepository = recentActivityRepository;
    }

    @Transactional
    @EventListener
    public void handleGamificationEvent(GamificationEvent event) {
        UUID userId = event.getUserId();
        LocalDate today = LocalDate.now();

        // 1. Log Recent Activity
        recentActivityRepository.save(new RecentActivity(
                userId, event.getEventType().name(), event.getDescription(), event.getRelatedEntityId()
        ));

        // 2. Fetch or Create Stats
        UserStats stats = userStatsRepository.findById(userId)
                .orElseGet(() -> new UserStats(userId));

        // 3. Process Specific Event Types
        if (event.getEventType() == GamificationEvent.EventType.COMMIT) {
            handleCommitEvent(userId, today, stats);
        } else if (event.getEventType() == GamificationEvent.EventType.PROJECT_CREATE) {
            checkAndAwardBadge(userId, BadgeType.CREATOR);
        } else if (event.getEventType() == GamificationEvent.EventType.ROOM_JOIN) {
            stats.setRoomsJoined(stats.getRoomsJoined() + 1);
            checkAndAwardBadge(userId, BadgeType.TEAM_PLAYER);
        }

        userStatsRepository.save(stats);
    }

    private void handleCommitEvent(UUID userId, LocalDate today, UserStats stats) {
        // Increment Total Contributions
        stats.setTotalContributions(stats.getTotalContributions() + 1);

        // Daily Contribution Heatmap Update
        DailyContribution daily = dailyContributionRepository.findByUserIdAndDate(userId, today)
                .orElseGet(() -> new DailyContribution(userId, today));
        daily.incrementCount();
        dailyContributionRepository.save(daily);

        // Streak Calculation
        if (stats.getLastActivityDate() != null) {
            LocalDate lastActive = stats.getLastActivityDate().atZone(ZoneOffset.UTC).toLocalDate();
            long daysBetween = ChronoUnit.DAYS.between(lastActive, today);

            if (daysBetween == 1) {
                // Consecutive day
                stats.setCurrentStreak(stats.getCurrentStreak() + 1);
                if (stats.getCurrentStreak() > stats.getLongestStreak()) {
                    stats.setLongestStreak(stats.getCurrentStreak());
                }
            } else if (daysBetween > 1) {
                // Streak broken
                stats.setCurrentStreak(1);
            }
            // If daysBetween == 0, streak remains same
        } else {
            // First time activity
            stats.setCurrentStreak(1);
            stats.setLongestStreak(1);
        }
        stats.setLastActivityDate(Instant.now());

        // Check Badges
        checkAndAwardBadge(userId, BadgeType.FIRST_COMMIT);
        if (stats.getTotalContributions() >= 10) checkAndAwardBadge(userId, BadgeType.TEN_COMMITS);
        if (stats.getTotalContributions() >= 100) checkAndAwardBadge(userId, BadgeType.CENTURY_CLUB);

        if (stats.getCurrentStreak() >= 3) checkAndAwardBadge(userId, BadgeType.STREAK_3_DAYS);
        if (stats.getCurrentStreak() >= 7) checkAndAwardBadge(userId, BadgeType.STREAK_7_DAYS);
        if (stats.getCurrentStreak() >= 30) checkAndAwardBadge(userId, BadgeType.STREAK_30_DAYS);
    }

    private void checkAndAwardBadge(UUID userId, BadgeType badgeType) {
        if (!userBadgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            userBadgeRepository.save(new UserBadge(userId, badgeType));
        }
    }
}

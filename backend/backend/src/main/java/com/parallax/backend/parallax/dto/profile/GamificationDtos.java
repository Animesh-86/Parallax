package com.parallax.backend.parallax.dto.profile;

import com.parallax.backend.parallax.entity.gamification.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

public class GamificationDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileStatsDto {
        private int projects;
        private int roomsJoined;
        private int contributions;
        private int currentStreak;
        private int longestStreak;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeDto {
        private String id;
        private BadgeType type;
        private String name;
        private String description;
        private String iconUrl;
        private String tier;
        private Instant awardedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDto {
        private String id;
        private String activityType;
        private String description;
        private Instant timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyContributionDto {
        private String date; // YYYY-MM-DD
        private int count;
    }
}

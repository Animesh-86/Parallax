package com.parallax.backend.parallax.dto.profile;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@AllArgsConstructor
@Getter
@Setter
public class PublicProfileResponse {

    private String username;
    private String displayName;
    private String bio;
    private String location;
    private String avatarUrl;
    private Instant joinedAt;

    private GamificationDtos.ProfileStatsDto stats;
    private java.util.List<GamificationDtos.BadgeDto> badges;
    private java.util.List<GamificationDtos.ActivityDto> recentActivity;
    private java.util.List<GamificationDtos.DailyContributionDto> contributionGraph;
}

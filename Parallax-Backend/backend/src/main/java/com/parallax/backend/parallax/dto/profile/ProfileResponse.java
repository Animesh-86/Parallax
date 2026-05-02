package com.parallax.backend.parallax.dto.profile;

public class ProfileResponse extends PublicProfileResponse{

    private String email;

    public ProfileResponse(
            String username,
            String displayName,
            String bio,
            String location,
            String avatarUrl,
            java.time.Instant joinedAt,
            String email,
            GamificationDtos.ProfileStatsDto stats,
            java.util.List<GamificationDtos.BadgeDto> badges,
            java.util.List<GamificationDtos.ActivityDto> recentActivity,
            java.util.List<GamificationDtos.DailyContributionDto> contributionGraph
    ) {
        super(username, displayName, bio, location, avatarUrl, joinedAt, stats, badges, recentActivity, contributionGraph);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}

package com.parallax.backend.parallax.dto.profile;

public class ProfileResponse extends PublicProfileResponse{

    private String email;
    private String ideSettings;

    public ProfileResponse(
            String username,
            String displayName,
            String bio,
            String location,
            String avatarUrl,
            java.time.Instant joinedAt,
            String email,
            String ideSettings,
            GamificationDtos.ProfileStatsDto stats,
            java.util.List<GamificationDtos.BadgeDto> badges,
            java.util.List<GamificationDtos.ActivityDto> recentActivity,
            java.util.List<GamificationDtos.DailyContributionDto> contributionGraph
    ) {
        super(username, displayName, bio, location, avatarUrl, joinedAt, stats, badges, recentActivity, contributionGraph);
        this.email = email;
        this.ideSettings = ideSettings;
    }

    public String getEmail() {
        return email;
    }

    public String getIdeSettings() {
        return ideSettings;
    }
}

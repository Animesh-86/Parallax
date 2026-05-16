package com.parallax.backend.parallax.dto.profile;

import java.time.Instant;
import java.util.List;

public class PublicProfileResponse {

    private String username;
    private String displayName;
    private String bio;
    private String location;
    private String avatarUrl;
    private Instant joinedAt;

    private GamificationDtos.ProfileStatsDto stats;
    private List<GamificationDtos.BadgeDto> badges;
    private List<GamificationDtos.ActivityDto> recentActivity;
    private List<GamificationDtos.DailyContributionDto> contributionGraph;

    public PublicProfileResponse() {}

    public PublicProfileResponse(String username, String displayName, String bio, String location, String avatarUrl, Instant joinedAt, GamificationDtos.ProfileStatsDto stats, List<GamificationDtos.BadgeDto> badges, List<GamificationDtos.ActivityDto> recentActivity, List<GamificationDtos.DailyContributionDto> contributionGraph) {
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.location = location;
        this.avatarUrl = avatarUrl;
        this.joinedAt = joinedAt;
        this.stats = stats;
        this.badges = badges;
        this.recentActivity = recentActivity;
        this.contributionGraph = contributionGraph;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public GamificationDtos.ProfileStatsDto getStats() { return stats; }
    public void setStats(GamificationDtos.ProfileStatsDto stats) { this.stats = stats; }

    public List<GamificationDtos.BadgeDto> getBadges() { return badges; }
    public void setBadges(List<GamificationDtos.BadgeDto> badges) { this.badges = badges; }

    public List<GamificationDtos.ActivityDto> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<GamificationDtos.ActivityDto> recentActivity) { this.recentActivity = recentActivity; }

    public List<GamificationDtos.DailyContributionDto> getContributionGraph() { return contributionGraph; }
    public void setContributionGraph(List<GamificationDtos.DailyContributionDto> contributionGraph) { this.contributionGraph = contributionGraph; }
}

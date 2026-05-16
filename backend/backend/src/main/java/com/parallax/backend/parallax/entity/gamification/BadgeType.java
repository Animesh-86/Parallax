package com.parallax.backend.parallax.entity.gamification;

public enum BadgeType {
    // Commit Badges
    FIRST_COMMIT("First Commit", "Make your first code commit via version control", "https://api.iconify.design/lucide:git-commit.svg?color=%23D4AF37", "BEGINNER"),
    TEN_COMMITS("10 Commits", "Reach 10 code commits", "https://api.iconify.design/lucide:git-commit.svg?color=%234ADE80", "INTERMEDIATE"),
    CENTURY_CLUB("Century Club", "Reach 100 code commits", "https://api.iconify.design/lucide:git-commit.svg?color=%23EF6461", "EXPERT"),
    
    // Streaks
    STREAK_3_DAYS("On Fire", "Maintain a 3-day coding streak", "https://api.iconify.design/lucide:flame.svg?color=%23F59E0B", "BEGINNER"),
    STREAK_7_DAYS("Unstoppable", "Maintain a 7-day coding streak", "https://api.iconify.design/lucide:flame.svg?color=%23EF6461", "INTERMEDIATE"),
    STREAK_30_DAYS("Cosmic Coder", "Maintain a 30-day coding streak", "https://api.iconify.design/lucide:sparkles.svg?color=%23A855F7", "EXPERT"),

    // Projects
    CREATOR("Creator", "Create your first project", "https://api.iconify.design/lucide:folder.svg?color=%23D4AF37", "BEGINNER"),
    PORTFOLIO_BUILDER("Portfolio Builder", "Create 5 projects", "https://api.iconify.design/lucide:layers.svg?color=%234ADE80", "INTERMEDIATE"),
    
    // Collaboration
    TEAM_PLAYER("Team Player", "Join your first collaborative room", "https://api.iconify.design/lucide:users.svg?color=%23D4AF37", "BEGINNER"),
    HOST_WITH_MOST("The Host", "Host 5 collaborative sessions", "https://api.iconify.design/lucide:video.svg?color=%23A855F7", "INTERMEDIATE");

    private final String displayName;
    private final String description;
    private final String iconUrl;
    private final String tier;

    BadgeType(String displayName, String description, String iconUrl, String tier) {
        this.displayName = displayName;
        this.description = description;
        this.iconUrl = iconUrl;
        this.tier = tier;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public String getTier() {
        return tier;
    }
}

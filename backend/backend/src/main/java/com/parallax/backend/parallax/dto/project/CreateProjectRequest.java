package com.parallax.backend.parallax.dto.project;

import java.util.UUID;

public class CreateProjectRequest {
    private String name;
    private String language;
    private UUID teamId; // nullable — if provided, project belongs to a team
    private String githubRepoUrl;
    private boolean aiReviewEnabled;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public String getGithubRepoUrl() {
        return githubRepoUrl;
    }

    public void setGithubRepoUrl(String githubRepoUrl) {
        this.githubRepoUrl = githubRepoUrl;
    }

    public boolean isAiReviewEnabled() {
        return aiReviewEnabled;
    }

    public void setAiReviewEnabled(boolean aiReviewEnabled) {
        this.aiReviewEnabled = aiReviewEnabled;
    }
}

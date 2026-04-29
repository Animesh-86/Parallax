package com.parallax.backend.parallax.dto.project;

import java.util.UUID;

public class CreateProjectRequest {
    private String name;
    private String language;
    private UUID teamId; // nullable — if provided, project belongs to a team

    public String getName() {
        return name;
    }

    public String getLanguage() {
        return language;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }
}

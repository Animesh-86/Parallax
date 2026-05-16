package com.parallax.backend.parallax.dto.project;

public class UpdateProjectSettingsRequest {
    private String name;
    private String description;
    private String settingsJson;

    public UpdateProjectSettingsRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSettingsJson() { return settingsJson; }
    public void setSettingsJson(String settingsJson) { this.settingsJson = settingsJson; }
}

package com.parallax.backend.parallax.dto.project;

import lombok.Data;

@Data
public class UpdateProjectSettingsRequest {
    private String name;
    private String description;
    private String settingsJson;
}

package com.parallax.backend.parallax.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateTeamRequest {

    @NotBlank
    @Size(min = 2, max = 120)
    private String name;

    @Size(max = 300)
    private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

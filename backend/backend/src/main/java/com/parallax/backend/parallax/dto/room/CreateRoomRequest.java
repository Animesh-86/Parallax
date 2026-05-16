package com.parallax.backend.parallax.dto.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    @Size(min = 1, max = 100, message = "Room name must be between 1 and 100 characters")
    private String name;

    // Optional: INTERVIEW or TEAM. Defaults to TEAM.
    private String collaborationMode;

    public CreateRoomRequest() {}

    public CreateRoomRequest(String name) {
        this.name = name;
    }

    public CreateRoomRequest(String name, String collaborationMode) {
        this.name = name;
        this.collaborationMode = collaborationMode;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCollaborationMode() { return collaborationMode; }
    public void setCollaborationMode(String collaborationMode) { this.collaborationMode = collaborationMode; }
}

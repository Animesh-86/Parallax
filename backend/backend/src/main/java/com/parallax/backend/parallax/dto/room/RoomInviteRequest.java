package com.parallax.backend.parallax.dto.room;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RoomInviteRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    private String email;

    public RoomInviteRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

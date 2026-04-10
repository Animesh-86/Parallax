package com.parallax.backend.parallax.dto.team;

import com.parallax.backend.parallax.entity.team.TeamMemberRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class InviteTeamMemberRequest {

    @NotBlank
    @Email
    private String email;

    private TeamMemberRole role = TeamMemberRole.MEMBER;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public TeamMemberRole getRole() {
        return role;
    }

    public void setRole(TeamMemberRole role) {
        this.role = role;
    }
}

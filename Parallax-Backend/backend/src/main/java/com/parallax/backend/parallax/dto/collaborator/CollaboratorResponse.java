package com.parallax.backend.parallax.dto.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public class CollaboratorResponse {

    private UUID id;
    private String nameOrEmail;
    private CollaboratorRole role;
    private CollaboratorStatus status;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private Instant invitedAt;
    private Instant acceptedAt;

    public CollaboratorResponse() {}

    public CollaboratorResponse(UUID id, String nameOrEmail, CollaboratorRole role, CollaboratorStatus status, boolean isOnline, Instant invitedAt, Instant acceptedAt) {
        this.id = id;
        this.nameOrEmail = nameOrEmail;
        this.role = role;
        this.status = status;
        this.isOnline = isOnline;
        this.invitedAt = invitedAt;
        this.acceptedAt = acceptedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNameOrEmail() { return nameOrEmail; }
    public void setNameOrEmail(String nameOrEmail) { this.nameOrEmail = nameOrEmail; }

    public CollaboratorRole getRole() { return role; }
    public void setRole(CollaboratorRole role) { this.role = role; }

    public CollaboratorStatus getStatus() { return status; }
    public void setStatus(CollaboratorStatus status) { this.status = status; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { isOnline = online; }

    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
}

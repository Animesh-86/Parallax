package com.parallax.backend.parallax.dto.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class CollaboratorResponse {

    private UUID id;
    private String nameOrEmail;
    private CollaboratorRole role;
    private CollaboratorStatus status;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private Instant invitedAt;
    private Instant acceptedAt;

}

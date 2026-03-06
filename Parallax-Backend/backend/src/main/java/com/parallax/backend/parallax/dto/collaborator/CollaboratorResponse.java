package com.parallax.backend.parallax.dto.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
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
    private Instant invitedAt;
    private Instant acceptedAt;

}

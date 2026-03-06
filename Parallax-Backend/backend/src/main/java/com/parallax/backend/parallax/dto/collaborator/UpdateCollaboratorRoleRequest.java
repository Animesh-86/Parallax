package com.parallax.backend.parallax.dto.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCollaboratorRoleRequest {

    @NotNull
    private CollaboratorRole role;
}

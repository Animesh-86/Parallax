package com.parallax.backend.parallax.service.collaborator;

import com.parallax.backend.parallax.dto.collaborator.CollaboratorResponse;
import com.parallax.backend.parallax.dto.collaborator.InvitationResponse;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.ProjectCollaborator;

import java.util.List;
import java.util.UUID;

public interface ProjectCollaboratorService {

    InvitationResponse inviteCollaborator(
            UUID projectId,
            String inviteeEmail,
            UUID requesterId
    );

    ProjectCollaborator acceptInvitation(
            UUID invitationId,
            UUID userId
    );

    void rejectInvitation(
            UUID invitationId,
            UUID userId
    );

    void removeCollaborator(
            UUID projectId,
            UUID targetUserId,
            UUID requesterId
    );

    List<CollaboratorResponse> listProjectCollaborators(
            UUID projectId,
            UUID requesterId
    );

    List<CollaboratorResponse> listUserProjects(
            UUID userId
    );

    ProjectCollaborator updateRole(
            UUID projectId,
            UUID targetUserId,
            CollaboratorRole newRole,
            UUID requesterId
    );
}

package com.parallax.backend.parallax.service.chat;

import com.parallax.backend.parallax.dto.chat.CallSignalMessage;
import com.parallax.backend.parallax.entity.chat.MessageType;
import com.parallax.backend.parallax.exception.ForbiddenException;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.store.CallSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CallServiceImpl implements CallService {

    private static final int MAX_CALL_SIZE = 4;

    private final CallSessionRegistry registry;
    private final ProjectAccessManager accessManager;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Set<UUID> joinCall(UUID projectId, UUID userId) {

        // Project membership check (OWNER / COLLABORATOR / VIEWER, ACCEPTED)
        accessManager.require(
                projectId,
                userId,
                ProjectPermission.READ_COLLABORATORS
        );

        //  Atomic join with capacity enforcement
        boolean joined = registry.tryJoin(projectId, userId, MAX_CALL_SIZE);
        if (!joined) {
            throw new ForbiddenException("Call participant limit reached");
        }

        return registry.getParticipants(projectId);
    }

    @Override
    public void leaveCall(UUID projectId, UUID userId) {
        registry.leave(projectId, userId);
    }

    @Override
    public boolean isParticipant(UUID projectId, UUID userId) {
        return registry.isInCall(projectId, userId);
    }

    /**
     * Forced removal (used for collaborator removal, disconnect cleanup, etc.)
     */
    @Override
    public void forceLeave(UUID projectId, UUID userId) {
        if (!registry.isInCall(projectId, userId)) return;

        registry.leave(projectId, userId);

        CallSignalMessage leaveMsg = new CallSignalMessage();
        leaveMsg.setType(MessageType.CALL_LEAVE);
        leaveMsg.setProjectId(projectId);
        leaveMsg.setFromUserId(userId);

        messagingTemplate.convertAndSend(
                "/topic/project/" + projectId + "/call",
                leaveMsg
        );
    }
}

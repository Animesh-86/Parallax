package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.CodeEditMessage;
import com.parallax.backend.parallax.dto.project.ProjectErrorMessage;
import com.parallax.backend.parallax.exception.ForbiddenException;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.file.DebouncedFileSaveManager;
import com.parallax.backend.parallax.service.file.FileSyncService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CodeEditingService {

    private static final Logger log = LoggerFactory.getLogger(CodeEditingService.class);
    private static final int MAX_CONTENT_SIZE = 300_000;

    private final DebouncedFileSaveManager debouncedFileSaveManager;
    private final FileSyncService fileSyncService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProjectAccessManager accessManager;

    // MAIN ENTRY
    public void handleEdit(UUID projectId, CodeEditMessage msg, UUID userId) {

        log.info("📝 handleEdit called: projectId={}, path={}, isDelta={}, contentIsNull={}, contentLen={}",
                projectId, msg.getPath(), msg.getIsDelta(),
                msg.getContent() == null, msg.getContent() == null ? -1 : msg.getContent().length());

        // 🔐 AUTHORIZATION
        try {
            accessManager.require(
                    projectId,
                    userId,
                    ProjectPermission.UPDATE_FILE
            );
        } catch (ForbiddenException e) {
            log.warn("📝 FORBIDDEN: userId={} cannot edit projectId={}", userId, projectId);
            publishError(projectId, "forbidden", "Not authorized");
            return;
        }

        // PATH VALIDATION
        final String path;
        try {
            path = fileSyncService.sanitizeUserPath(msg.getPath());
        } catch (IllegalArgumentException e) {
            log.warn("📝 INVALID PATH: {}", msg.getPath());
            publishError(projectId, "invalid_path", e.getMessage());
            return;
        }

        // PAYLOAD VALIDATION
        String content = msg.getContent();
        if (content != null && content.length() > MAX_CONTENT_SIZE) {
            publishError(projectId, "payload_too_large", "Content too large");
            return;
        }

        log.info("📝 Scheduling save: projectId={}, path={}, contentIsNull={}, contentLen={}",
                projectId, path, content == null, content == null ? -1 : content.length());

        // ASYNC DURABLE SAVE (DB + FS + SESSION handled later)
        debouncedFileSaveManager.scheduleSave(
                projectId,
                path,
                content,
                userId
        );

        // REAL-TIME BROADCAST
        CodeEditMessage broadcastMsg = new CodeEditMessage(
                projectId.toString(),
                userId.toString(),
                path,
                msg.getIsDelta() ? null : content, // STRIP full content if it's a delta to save bandwidth!
                null,
                msg.getIsDelta(),
                msg.getChanges()
        );

        messagingTemplate.convertAndSend(
                "/topic/projects/" + projectId + "/code",
                broadcastMsg
        );
    }

    private void publishError(UUID projectId, String code, String message) {
        messagingTemplate.convertAndSend(
                "/topic/projects/" + projectId + "/errors",
                new ProjectErrorMessage(code, message)
        );
    }
}

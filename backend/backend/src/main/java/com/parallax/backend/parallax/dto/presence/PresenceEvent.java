package com.parallax.backend.parallax.dto.presence;

import java.time.Instant;
import java.util.UUID;

public class PresenceEvent {
    private PresenceEventType type;
    private UUID userId;
    private UUID projectId;
    private UUID fileId;
    private Instant timestamp;

    public PresenceEvent() {}

    public PresenceEvent(PresenceEventType type, UUID userId, UUID projectId, UUID fileId, Instant timestamp) {
        this.type = type;
        this.userId = userId;
        this.projectId = projectId;
        this.fileId = fileId;
        this.timestamp = timestamp;
    }

    public PresenceEventType getType() { return type; }
    public void setType(PresenceEventType type) { this.type = type; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getFileId() { return fileId; }
    public void setFileId(UUID fileId) { this.fileId = fileId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}

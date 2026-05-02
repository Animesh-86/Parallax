package com.parallax.backend.parallax.service.gamification;

import org.springframework.context.ApplicationEvent;
import java.util.UUID;

public class GamificationEvent extends ApplicationEvent {
    public enum EventType {
        COMMIT,
        PROJECT_CREATE,
        ROOM_JOIN
    }

    private final UUID userId;
    private final EventType eventType;
    private final String description;
    private final UUID relatedEntityId;

    public GamificationEvent(Object source, UUID userId, EventType eventType, String description, UUID relatedEntityId) {
        super(source);
        this.userId = userId;
        this.eventType = eventType;
        this.description = description;
        this.relatedEntityId = relatedEntityId;
    }

    public UUID getUserId() { return userId; }
    public EventType getEventType() { return eventType; }
    public String getDescription() { return description; }
    public UUID getRelatedEntityId() { return relatedEntityId; }
}

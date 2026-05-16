package com.parallax.backend.parallax.dto.room;

import java.util.Map;
import java.util.UUID;

public class RoomSignalMessage {

    private String type;
    private Map<String, Object> payload;
    private UUID senderId;
    private UUID targetId;

    public RoomSignalMessage() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }
}

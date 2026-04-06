package com.parallax.backend.parallax.dto.room;

import java.time.Instant;
import java.util.UUID;

public class RoomResponse {
    private UUID id;
    private String name;
    private UUID createdBy;
    private Instant createdAt;
    private String roomCode;
    private boolean isActive;
    private boolean codeOpen;
    private boolean whiteboardEnabled;
        private String collaborationMode;
        private String whiteboardVisibility;
        private String whiteboardEditPolicy;
        private String codeVisibility;
        private String taskVisibility;
        private boolean chatDisabled;
        private boolean screenShareDisabled;

    public RoomResponse(UUID id, String name, UUID createdBy, Instant createdAt, String roomCode, boolean isActive,
            boolean codeOpen, boolean whiteboardEnabled,
            String collaborationMode, String whiteboardVisibility, String whiteboardEditPolicy,
            String codeVisibility, String taskVisibility, boolean chatDisabled, boolean screenShareDisabled) {
        this.id = id;
        this.name = name;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.roomCode = roomCode;
        this.isActive = isActive;
        this.codeOpen = codeOpen;
        this.whiteboardEnabled = whiteboardEnabled;
        this.collaborationMode = collaborationMode;
        this.whiteboardVisibility = whiteboardVisibility;
        this.whiteboardEditPolicy = whiteboardEditPolicy;
        this.codeVisibility = codeVisibility;
        this.taskVisibility = taskVisibility;
        this.chatDisabled = chatDisabled;
        this.screenShareDisabled = screenShareDisabled;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public String getRoomCode() { return roomCode; }
    public boolean isActive() { return isActive; }
    public boolean isCodeOpen() { return codeOpen; }
    public boolean isWhiteboardEnabled() { return whiteboardEnabled; }
    public String getCollaborationMode() { return collaborationMode; }
    public String getWhiteboardVisibility() { return whiteboardVisibility; }
    public String getWhiteboardEditPolicy() { return whiteboardEditPolicy; }
    public String getCodeVisibility() { return codeVisibility; }
    public String getTaskVisibility() { return taskVisibility; }
    public boolean isChatDisabled() { return chatDisabled; }
    public boolean isScreenShareDisabled() { return screenShareDisabled; }

    public void setId(UUID id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public void setActive(boolean active) { isActive = active; }
    public void setCodeOpen(boolean codeOpen) { this.codeOpen = codeOpen; }
    public void setWhiteboardEnabled(boolean whiteboardEnabled) { this.whiteboardEnabled = whiteboardEnabled; }
    public void setCollaborationMode(String collaborationMode) { this.collaborationMode = collaborationMode; }
    public void setWhiteboardVisibility(String whiteboardVisibility) { this.whiteboardVisibility = whiteboardVisibility; }
    public void setWhiteboardEditPolicy(String whiteboardEditPolicy) { this.whiteboardEditPolicy = whiteboardEditPolicy; }
    public void setCodeVisibility(String codeVisibility) { this.codeVisibility = codeVisibility; }
    public void setTaskVisibility(String taskVisibility) { this.taskVisibility = taskVisibility; }
    public void setChatDisabled(boolean chatDisabled) { this.chatDisabled = chatDisabled; }
    public void setScreenShareDisabled(boolean screenShareDisabled) { this.screenShareDisabled = screenShareDisabled; }
}

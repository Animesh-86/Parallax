package com.parallax.backend.parallax.entity.room;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "meeting_rooms")
public class MeetingRoom {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "room_code", unique = true, length = 20)
    private String roomCode;

    @Column(name = "code_open", nullable = false)
    private boolean codeOpen;

    @Column(name = "whiteboard_enabled", nullable = false)
    private boolean whiteboardEnabled;

    @Column(name = "collaboration_mode", nullable = false, length = 20)
    private String collaborationMode;

    @Column(name = "whiteboard_visibility", nullable = false, length = 20)
    private String whiteboardVisibility;

    @Column(name = "whiteboard_edit_policy", nullable = false, length = 20)
    private String whiteboardEditPolicy;

    @Column(name = "code_visibility", nullable = false, length = 20)
    private String codeVisibility;

    @Column(name = "task_visibility", nullable = false, length = 20)
    private String taskVisibility;

    @Column(name = "chat_disabled", nullable = false)
    private boolean chatDisabled;

    @Column(name = "screen_share_disabled", nullable = false)
    private boolean screenShareDisabled;

    protected MeetingRoom() {}

    public MeetingRoom(String name, UUID createdBy, String roomCode) {
        this.name = name;
        this.createdBy = createdBy;
        this.roomCode = roomCode;
        this.createdAt = Instant.now();
        this.isActive = true;
        this.codeOpen = false;
        this.whiteboardEnabled = true;
        this.collaborationMode = "TEAM";
        this.whiteboardVisibility = "PUBLIC";
        this.whiteboardEditPolicy = "EVERYONE";
        this.codeVisibility = "PRIVATE";
        this.taskVisibility = "PRIVATE";
        this.chatDisabled = false;
        this.screenShareDisabled = false;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isActive() { return isActive; }
    public String getRoomCode() { return roomCode; }
    public boolean isCodeOpen() { return codeOpen; }
    public boolean isWhiteboardEnabled() { return whiteboardEnabled; }
    public String getCollaborationMode() { return collaborationMode; }
    public String getWhiteboardVisibility() { return whiteboardVisibility; }
    public String getWhiteboardEditPolicy() { return whiteboardEditPolicy; }
    public String getCodeVisibility() { return codeVisibility; }
    public String getTaskVisibility() { return taskVisibility; }
    public boolean isChatDisabled() { return chatDisabled; }
    public boolean isScreenShareDisabled() { return screenShareDisabled; }

    public void setName(String name) { this.name = name; }
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

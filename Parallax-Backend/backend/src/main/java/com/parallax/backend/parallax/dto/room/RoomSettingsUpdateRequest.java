package com.parallax.backend.parallax.dto.room;

public class RoomSettingsUpdateRequest {

    private Boolean codeOpen;
    private Boolean whiteboardEnabled;
    private String collaborationMode;
    private String whiteboardVisibility;
    private String whiteboardEditPolicy;
    private String codeVisibility;
    private String taskVisibility;

    public RoomSettingsUpdateRequest() {
    }

    public Boolean getCodeOpen() {
        return codeOpen;
    }

    public void setCodeOpen(Boolean codeOpen) {
        this.codeOpen = codeOpen;
    }

    public Boolean getWhiteboardEnabled() {
        return whiteboardEnabled;
    }

    public void setWhiteboardEnabled(Boolean whiteboardEnabled) {
        this.whiteboardEnabled = whiteboardEnabled;
    }

    public String getCollaborationMode() {
        return collaborationMode;
    }

    public void setCollaborationMode(String collaborationMode) {
        this.collaborationMode = collaborationMode;
    }

    public String getWhiteboardVisibility() {
        return whiteboardVisibility;
    }

    public void setWhiteboardVisibility(String whiteboardVisibility) {
        this.whiteboardVisibility = whiteboardVisibility;
    }

    public String getWhiteboardEditPolicy() {
        return whiteboardEditPolicy;
    }

    public void setWhiteboardEditPolicy(String whiteboardEditPolicy) {
        this.whiteboardEditPolicy = whiteboardEditPolicy;
    }

    public String getCodeVisibility() {
        return codeVisibility;
    }

    public void setCodeVisibility(String codeVisibility) {
        this.codeVisibility = codeVisibility;
    }

    public String getTaskVisibility() {
        return taskVisibility;
    }

    public void setTaskVisibility(String taskVisibility) {
        this.taskVisibility = taskVisibility;
    }
}

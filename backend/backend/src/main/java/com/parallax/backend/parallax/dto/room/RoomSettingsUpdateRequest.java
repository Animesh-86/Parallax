package com.parallax.backend.parallax.dto.room;

public class RoomSettingsUpdateRequest {

    private Boolean codeOpen;
    private Boolean whiteboardEnabled;
    private String collaborationMode;
    private String whiteboardVisibility;
    private String whiteboardEditPolicy;
    private String codeVisibility;
    private String taskVisibility;
    private String taskEditPolicy;
    private Boolean chatDisabled;
    private Boolean screenShareDisabled;
    private java.util.List<java.util.UUID> whiteboardEditorUserIds;
    private java.util.List<java.util.UUID> codeEditorUserIds;

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

    public String getTaskEditPolicy() {
        return taskEditPolicy;
    }

    public void setTaskEditPolicy(String taskEditPolicy) {
        this.taskEditPolicy = taskEditPolicy;
    }

    public Boolean getChatDisabled() {
        return chatDisabled;
    }

    public void setChatDisabled(Boolean chatDisabled) {
        this.chatDisabled = chatDisabled;
    }

    public Boolean getScreenShareDisabled() {
        return screenShareDisabled;
    }

    public void setScreenShareDisabled(Boolean screenShareDisabled) {
        this.screenShareDisabled = screenShareDisabled;
    }

    public java.util.List<java.util.UUID> getWhiteboardEditorUserIds() {
        return whiteboardEditorUserIds;
    }

    public void setWhiteboardEditorUserIds(java.util.List<java.util.UUID> whiteboardEditorUserIds) {
        this.whiteboardEditorUserIds = whiteboardEditorUserIds;
    }

    public java.util.List<java.util.UUID> getCodeEditorUserIds() {
        return codeEditorUserIds;
    }

    public void setCodeEditorUserIds(java.util.List<java.util.UUID> codeEditorUserIds) {
        this.codeEditorUserIds = codeEditorUserIds;
    }
}

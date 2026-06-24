package com.parallax.backend.parallax.dto.execution;

import java.util.List;

public class CodeEditMessage {
    private String projectId;
    private String userId;
    private String path;
    private String content; // Still kept for full-saves to the backend
    private String token;
    
    // Delta-sync fields
    private boolean isDelta;
    private List<TextChange> changes;

    public CodeEditMessage() {}

    public CodeEditMessage(String projectId, String userId, String path, String content, String token) {
        this.projectId = projectId;
        this.userId = userId;
        this.path = path;
        this.content = content;
        this.token = token;
        this.isDelta = false;
    }

    public CodeEditMessage(String projectId, String userId, String path, String content, String token, boolean isDelta, List<TextChange> changes) {
        this.projectId = projectId;
        this.userId = userId;
        this.path = path;
        this.content = content;
        this.token = token;
        this.isDelta = isDelta;
        this.changes = changes;
    }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public boolean getIsDelta() { return isDelta; }
    public void setIsDelta(boolean isDelta) { this.isDelta = isDelta; }
    
    public List<TextChange> getChanges() { return changes; }
    public void setChanges(List<TextChange> changes) { this.changes = changes; }
}

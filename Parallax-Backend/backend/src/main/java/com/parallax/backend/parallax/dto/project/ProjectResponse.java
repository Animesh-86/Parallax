package com.parallax.backend.parallax.dto.project;

import java.util.List;
import java.util.UUID;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.entity.project.Project;

public class ProjectResponse {
    private UUID id;
    private String name;
    private String language;
    private List<FileDto> files;
    private String activeSessionId;
    private UUID teamId;
    private String teamName;
    private String createdAt;
    private String description;
    private String settingsJson;
    private String enabledExtensionsJson;
    private String runtimeName;

    public ProjectResponse() {}

    public ProjectResponse(UUID id, String name, String language, List<FileDto> files, String activeSessionId, UUID teamId, String teamName, String createdAt, String description, String settingsJson, String enabledExtensionsJson, String runtimeName) {
        this.id = id;
        this.name = name;
        this.language = language;
        this.files = files;
        this.activeSessionId = activeSessionId;
        this.teamId = teamId;
        this.teamName = teamName;
        this.createdAt = createdAt;
        this.description = description;
        this.settingsJson = settingsJson;
        this.enabledExtensionsJson = enabledExtensionsJson;
        this.runtimeName = runtimeName;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getLanguage() { return language; }
    public List<FileDto> getFiles() { return files; }
    public String getActiveSessionId() { return activeSessionId; }
    public UUID getTeamId() { return teamId; }
    public String getTeamName() { return teamName; }
    public String getCreatedAt() { return createdAt; }
    public String getDescription() { return description; }
    public String getSettingsJson() { return settingsJson; }
    public String getEnabledExtensionsJson() { return enabledExtensionsJson; }
    public String getRuntimeName() { return runtimeName; }

    public static class FileDto {
        private UUID id;
        private String name;
        private String path;

        public FileDto(UUID id, String name, String path) {
            this.id = id;
            this.name = name;
            this.path = path;
        }

        public UUID getId() { return id; }
        public String getName() { return name; }
        public String getPath() { return path; }
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String name;
        private String language;
        private List<FileDto> files;
        private String activeSessionId;
        private UUID teamId;
        private String teamName;
        private String createdAt;
        private String description;
        private String settingsJson;
        private String enabledExtensionsJson;
        private String runtimeName;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder language(String language) { this.language = language; return this; }
        public Builder files(List<FileDto> files) { this.files = files; return this; }
        public Builder activeSessionId(String activeSessionId) { this.activeSessionId = activeSessionId; return this; }
        public Builder teamId(UUID teamId) { this.teamId = teamId; return this; }
        public Builder teamName(String teamName) { this.teamName = teamName; return this; }
        public Builder createdAt(String createdAt) { this.createdAt = createdAt; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder settingsJson(String settingsJson) { this.settingsJson = settingsJson; return this; }
        public Builder enabledExtensionsJson(String enabledExtensionsJson) { this.enabledExtensionsJson = enabledExtensionsJson; return this; }
        public Builder runtimeName(String runtimeName) { this.runtimeName = runtimeName; return this; }

        public ProjectResponse build() {
            return new ProjectResponse(id, name, language, files, activeSessionId, teamId, teamName, createdAt, description, settingsJson, enabledExtensionsJson, runtimeName);
        }
    }

    public static ProjectResponse from(Project project, List<ProjectFile> files, String activeSessionId) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .language(project.getLanguage())
                .activeSessionId(activeSessionId)
                .teamId(project.getTeam() != null ? project.getTeam().getId() : null)
                .teamName(project.getTeam() != null ? project.getTeam().getName() : null)
                .createdAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null)
                .description(project.getDescription())
                .settingsJson(project.getSettingsJson())
                .enabledExtensionsJson(project.getEnabledExtensionsJson())
                .files(files.stream()
                        .map(f -> new FileDto(
                                f.getId(),
                                extractName(f.getPath()),
                                f.getPath()
                        ))
                        .toList())
                .build();
    }

    private static String extractName(String path) {
        if (path == null || path.isBlank()) return "";
        String cleaned = path;
        if (cleaned.endsWith("/")) cleaned = cleaned.substring(0, cleaned.length() - 1);
        if (!cleaned.contains("/")) return cleaned;
        return cleaned.substring(cleaned.lastIndexOf("/") + 1);
    }
}

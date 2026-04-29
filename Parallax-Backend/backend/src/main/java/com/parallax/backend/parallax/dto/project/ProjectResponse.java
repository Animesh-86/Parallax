package com.parallax.backend.parallax.dto.project;

import java.util.List;
import java.util.UUID;

import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.entity.project.Project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Data
@Builder
@AllArgsConstructor
@Getter
public class ProjectResponse {
    private UUID id;
    private String name;
    private String language;
    private List<FileDto> files;
    private String activeSessionId; // nullable
    private UUID teamId;            // nullable
    private String teamName;        // nullable

    @Data
    @AllArgsConstructor
    public static class FileDto {
        private UUID id;
        private String name;
        private String path;
    }

    public static ProjectResponse from(Project project, List<ProjectFile> files, String activeSessionId) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .language(project.getLanguage())
                .activeSessionId(activeSessionId)
                .teamId(project.getTeam() != null ? project.getTeam().getId() : null)
                .teamName(project.getTeam() != null ? project.getTeam().getName() : null)
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
        // remove trailing slash if accidental
        if (cleaned.endsWith("/")) cleaned = cleaned.substring(0, cleaned.length() - 1);
        if (!cleaned.contains("/")) return cleaned;
        return cleaned.substring(cleaned.lastIndexOf("/") + 1);
    }
}

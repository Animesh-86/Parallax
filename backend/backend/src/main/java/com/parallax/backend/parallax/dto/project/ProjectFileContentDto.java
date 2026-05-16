package com.parallax.backend.parallax.dto.project;

import java.util.UUID;

import com.parallax.backend.parallax.entity.file.ProjectFile;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProjectFileContentDto {
    private UUID id;
    private String path;
    private String content;

    public static ProjectFileContentDto from(ProjectFile file) {
        return new ProjectFileContentDto(
                file.getId(),
                file.getPath(),
                file.getContent()
        );
    }
}

package com.parallax.backend.parallax.dto.project;

<<<<<<< HEAD
import com.parallax.backend.parallax.entity.ProjectFile;
=======
import com.parallax.backend.parallax.entity.file.ProjectFile;
>>>>>>> origin/main
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

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

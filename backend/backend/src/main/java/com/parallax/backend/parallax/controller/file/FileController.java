package com.parallax.backend.parallax.controller.file;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.parallax.backend.parallax.dto.file.CreateFileRequest;
import com.parallax.backend.parallax.dto.project.ProjectFileContentDto;
import com.parallax.backend.parallax.dto.project.ProjectFileInfoDto;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.file.FileService;

@RestController
@RequestMapping("/api/projects")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // ------------------------------------------------
    // Get all files (flat list, DB-based)
    // ------------------------------------------------
    @GetMapping("/{projectId}/files")
    public ResponseEntity<List<ProjectFileInfoDto>> getProjectFiles(
            @PathVariable UUID projectId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);

        List<ProjectFile> files =
                fileService.findAll(projectId, userId);

        return ResponseEntity.ok(
                files.stream()
                        .map(ProjectFileInfoDto::from)
                        .toList()
        );
    }

    // ------------------------------------------------
    // Get single file (content)
    // ------------------------------------------------
    @GetMapping(
            path = "/{projectId}/file",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ProjectFileContentDto> getFile(
            @PathVariable UUID projectId,
            @RequestParam String path,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);

        ProjectFile file =
                fileService.getFile(projectId, path, userId);

        return ResponseEntity.ok(ProjectFileContentDto.from(file));
    }

    // ------------------------------------------------
    // Save file content
    // ------------------------------------------------
    @PutMapping("/{projectId}/file")
    public ResponseEntity<ProjectFileContentDto> saveFile(
            @PathVariable UUID projectId,
            @RequestParam String path,
            @RequestBody String content,
            Authentication authentication
    ) throws IOException {

        UUID userId = AuthUtil.requireUserId(authentication);

        ProjectFile updated =
                fileService.save(projectId, path, content, userId);

        return ResponseEntity.ok(ProjectFileContentDto.from(updated));
    }

    // ------------------------------------------------
    // Create new file / folder
    // ------------------------------------------------
    @PostMapping("/{projectId}/files")
    public ResponseEntity<ProjectFileInfoDto> createFile(
            @PathVariable UUID projectId,
            @RequestBody CreateFileRequest body,
            Authentication authentication
    ) throws IOException {

        UUID userId = AuthUtil.requireUserId(authentication);

        ProjectFile file = fileService.createFile(
                projectId,
                body.getPath(),
                body.getType(),
                userId
        );

        return ResponseEntity.ok(ProjectFileInfoDto.from(file));
    }
}

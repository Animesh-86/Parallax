package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private static final Logger log =
            LoggerFactory.getLogger(FileService.class);

    private final ProjectFileRepository fileRepo;
    private final ProjectAccessManager accessManager;
    private final FileSyncService fileSyncService;
    private final SessionRegistry sessionRegistry;
    private final StorageProperties storageProperties;

    // READS
    public List<ProjectFile> findAll(UUID projectId, UUID userId) {
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
        return fileRepo.findByProjectId(projectId);
    }

    public ProjectFile getFile(UUID projectId, String path, UUID userId) {
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE);

        String safePath = fileSyncService.sanitizeUserPath(path);

        ProjectFile file =
                fileRepo.findByProjectIdAndPath(projectId, safePath);

        if (file == null) {
            throw new ResourceNotFoundException("File not found: " + safePath);
        }

        // VFS: Read from disk as single source of truth
        Path resolved = resolveProjectPath(projectId, safePath);
        try {
            if (Files.exists(resolved) && !Files.isDirectory(resolved)) {
                String diskContent = Files.readString(resolved, StandardCharsets.UTF_8);
                file.setContent(diskContent);
            } else if (!"FOLDER".equalsIgnoreCase(file.getType()) && file.getContent() != null) {
                // Lazy migration: File missing on disk, but has DB content. Write to disk.
                Files.createDirectories(resolved.getParent());
                Files.writeString(
                        resolved,
                        file.getContent(),
                        StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.TRUNCATE_EXISTING
                );
            }
        } catch (IOException e) {
            log.warn("Failed to read/migrate file from disk: {}", safePath, e);
        }

        return file;
    }

    // CREATE
    @Transactional
    public ProjectFile createFile(
            UUID projectId,
            String path,
            String type,
            UUID userId
    ) {

        String safePath = fileSyncService.sanitizeUserPath(path);
        String t = type.toUpperCase();

        if ("FILE".equals(t)) {
            accessManager.require(projectId, userId, ProjectPermission.CREATE_FILE);
        } else if ("FOLDER".equals(t)) {
            accessManager.require(projectId, userId, ProjectPermission.CREATE_FOLDER);
        } else {
            throw new IllegalArgumentException("Invalid type: " + type);
        }

        if (fileRepo.existsByProjectIdAndPath(projectId, safePath)) {
            throw new IllegalStateException("Already exists: " + safePath);
        }

        ProjectFile pf = new ProjectFile(
                UUID.randomUUID(),
                projectId,
                safePath,
                "FILE".equals(t) ? "" : null,
                t
        );

        pf.setCreatedAt(Instant.now());
        pf.setUpdatedAt(Instant.now());
        fileRepo.save(pf);

        // ---------------- Filesystem (authoritative)
        Path resolved = resolveProjectPath(projectId, safePath);

        try {
            if ("FOLDER".equals(t)) {
                Files.createDirectories(resolved);
            } else {
                Files.createDirectories(resolved.getParent());
                Files.writeString(
                        resolved,
                        "",
                        StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE_NEW
                );
            }
        } catch (IOException e) {
            log.error("Filesystem sync failed for {}", safePath, e);
            throw new IllegalStateException("Failed to create file on disk", e);
        }

        return pf;
    }

    // UPDATE
    @Transactional
    public ProjectFile save(
            UUID projectId,
            String path,
            String content,
            UUID userId
    ) {

        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);

        String safePath = fileSyncService.sanitizeUserPath(path);

        ProjectFile file =
                fileRepo.findByProjectIdAndPath(projectId, safePath);

        if (file == null) {
            throw new ResourceNotFoundException("File not found: " + safePath);
        }

        if (!"FILE".equalsIgnoreCase(file.getType())) {
            throw new IllegalArgumentException("Not a file");
        }

        // ---------------- DB FIRST (authoritative)
        file.setContent(content);
        file.setUpdatedAt(Instant.now());
        fileRepo.saveAndFlush(file);

        // ---------------- Filesystem SECOND (Authoritative)
        Path resolved = resolveProjectPath(projectId, safePath);

        try {
            Files.createDirectories(resolved.getParent());
            Files.writeString(
                    resolved,
                    content == null ? "" : content,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );
        } catch (IOException e) {
            log.error("Filesystem write failed for {}", safePath, e);
            throw new IllegalStateException("Failed to save file to disk", e);
        }

        return file;
    }

    // HELPERS
    private Path resolveProjectPath(UUID projectId, String safePath) {
        Path root = Paths.get(storageProperties.getProjects())
                .resolve(projectId.toString())
                .toAbsolutePath()
                .normalize();

        Path resolved = root.resolve(safePath).normalize();
        if (!resolved.startsWith(root)) {
            throw new IllegalArgumentException("Invalid path");
        }
        return resolved;
    }
}

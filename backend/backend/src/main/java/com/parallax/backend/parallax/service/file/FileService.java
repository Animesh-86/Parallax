package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.dto.file.FileSearchResultDto;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

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

    private static final java.util.regex.Pattern SAFE_FILENAME_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9._/\\- ]+$");

    // CREATE
    @Transactional
    public ProjectFile createFile(
            UUID projectId,
            String path,
            String type,
            UUID userId
    ) {

        String safePath = fileSyncService.sanitizeUserPath(path);
        if (!SAFE_FILENAME_PATTERN.matcher(safePath).matches()) {
            throw new IllegalArgumentException(
                    "Filename contains invalid characters. Only alphanumeric, dots, underscores, hyphens, and slashes are allowed."
            );
        }
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

    @Transactional
    public void deleteFile(UUID projectId, String path, UUID userId) {
        accessManager.require(projectId, userId, ProjectPermission.UPDATE_FILE);

        String safePath = fileSyncService.sanitizeUserPath(path);

        ProjectFile file = fileRepo.findByProjectIdAndPath(projectId, safePath);
        if (file == null) {
            throw new ResourceNotFoundException("File not found: " + safePath);
        }

        // DB Delete children if folder
        if ("FOLDER".equalsIgnoreCase(file.getType())) {
            List<ProjectFile> allFiles = fileRepo.findByProjectId(projectId);
            List<ProjectFile> children = allFiles.stream()
                    .filter(f -> f.getPath().startsWith(safePath + "/"))
                    .toList();
            fileRepo.deleteAll(children);
        }

        // DB Delete itself
        fileRepo.delete(file);
        fileRepo.flush();

        // Filesystem Delete
        Path resolved = resolveProjectPath(projectId, safePath);
        try {
            if (Files.exists(resolved)) {
                if (Files.isDirectory(resolved)) {
                    try (java.util.stream.Stream<Path> paths = Files.walk(resolved)) {
                        paths.sorted(java.util.Comparator.reverseOrder())
                             .forEach(p -> {
                                 try {
                                     Files.delete(p);
                                 } catch (IOException e) {
                                     log.error("Failed to delete child {}", p, e);
                                 }
                             });
                    }
                } else {
                    Files.delete(resolved);
                }
            }
        } catch (IOException e) {
            log.error("Filesystem delete failed for {}", safePath, e);
            throw new IllegalStateException("Failed to delete file on disk", e);
        }
    }

    @Transactional
    public void syncDbFromDisk(UUID projectId) {
        Path root = Paths.get(storageProperties.getProjects())
                .resolve(projectId.toString())
                .toAbsolutePath()
                .normalize();
        if (!Files.exists(root)) {
            return;
        }

        try {
            fileRepo.deleteByProjectId(projectId);
            fileRepo.flush();

            try (java.util.stream.Stream<Path> paths = Files.walk(root)) {
                paths.filter(p -> !p.equals(root))
                     .filter(p -> !p.toString().replace("\\", "/").contains("/.git"))
                     .forEach(p -> {
                         String safePath = root.relativize(p).toString().replace("\\", "/");
                         boolean isFolder = Files.isDirectory(p);
                         String type = isFolder ? "FOLDER" : "FILE";
                         
                         ProjectFile pf = new ProjectFile(
                                 UUID.randomUUID(),
                                 projectId,
                                 safePath,
                                 null,
                                 type
                         );
                         pf.setCreatedAt(Instant.now());
                         pf.setUpdatedAt(Instant.now());
                         fileRepo.save(pf);
                     });
            }
            fileRepo.flush();
        } catch (IOException e) {
            log.error("Failed to sync DB from disk for project {}", projectId, e);
        }
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

    public List<FileSearchResultDto> searchFiles(UUID projectId, String query, UUID userId) {
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
        
        List<FileSearchResultDto> results = new ArrayList<>();
        if (query == null || query.isBlank()) {
            return results;
        }
        
        String lowerQuery = query.toLowerCase();
        Path root = Paths.get(storageProperties.getProjects())
                .resolve(projectId.toString())
                .toAbsolutePath()
                .normalize();
                
        if (!Files.exists(root) || !Files.isDirectory(root)) {
            return results;
        }

        try (Stream<Path> stream = Files.walk(root)) {
            stream.filter(Files::isRegularFile)
                  .filter(path -> {
                      String rel = root.relativize(path).toString();
                      return !rel.contains(".git") && !rel.contains("node_modules") && !rel.contains("target");
                  })
                  .forEach(path -> {
                      if (results.size() >= 100) return; // Cap results
                      
                      try {
                          List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                          for (int i = 0; i < lines.size(); i++) {
                              if (results.size() >= 100) break;
                              
                              String line = lines.get(i);
                              if (line.toLowerCase().contains(lowerQuery)) {
                                  String relPath = root.relativize(path).toString().replace("\\", "/");
                                  results.add(new FileSearchResultDto(relPath, i + 1, line.trim()));
                              }
                          }
                      } catch (Exception e) {
                          // Ignore binary files or unreadable files
                      }
                  });
        } catch (IOException e) {
            log.error("Failed to search files in project {}", projectId, e);
        }
        
        return results;
    }
}

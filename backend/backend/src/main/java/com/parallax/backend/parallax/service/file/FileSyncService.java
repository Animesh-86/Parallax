package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class FileSyncService {

    private static final Logger log =
            LoggerFactory.getLogger(FileSyncService.class);

    private final ProjectFileRepository fileRepo;
    private final Path basePath;

    @PersistenceContext
    private EntityManager entityManager;

    public FileSyncService(
            ProjectFileRepository fileRepo,
            @Value("${code.runner.base-path:/var/code_sessions}") String basePath
    ) {
        this.fileRepo = fileRepo;
        this.basePath = Paths.get(basePath).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            throw new RuntimeException("Unable to create session base path", e);
        }
    }

    // ==================================================
    // CANONICAL PATH SANITIZER (SINGLE SOURCE)
    // ==================================================

    public String sanitizeUserPath(String userPath) {
        if (userPath == null || userPath.isBlank()) {
            throw new IllegalArgumentException("Path cannot be empty");
        }

        String cleaned = userPath
                .replace("\\", "/")
                .replaceAll("/{2,}", "/");

        if (cleaned.contains("..") || cleaned.contains("\0")) {
            throw new IllegalArgumentException("Invalid path traversal");
        }

        if (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }

        return cleaned;
    }

    // (Obsolete sync methods removed: VFS mounts project dir directly)

    // ==================================================
    // INTERNAL HELPERS
    // ==================================================

    private Path getSessionDir(String sessionId) {
        return basePath.resolve(sessionId).normalize();
    }

    private Path resolvePathSafely(Path baseDir, String safePath) {
        Path target = baseDir.resolve(safePath).normalize();
        if (!target.startsWith(baseDir)) {
            throw new IllegalArgumentException("Path traversal detected");
        }
        return target;
    }
}

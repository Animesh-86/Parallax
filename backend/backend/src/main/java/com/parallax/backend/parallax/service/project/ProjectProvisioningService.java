package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectProvisioningService {

    private final StorageProperties storageProperties;

    public void createProjectRootOnDisk(UUID projectId, List<ProjectFile> initialFiles) {
        Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());

        try {
            Files.createDirectories(projectRoot);

            for (ProjectFile f : initialFiles) {
                Path p = projectRoot.resolve(f.getPath());

                if ("FOLDER".equals(f.getType())) {
                    Files.createDirectories(p);
                } else {
                    if (p.getParent() != null) {
                        Files.createDirectories(p.getParent());
                    }
                    Files.writeString(
                            p,
                            f.getContent() == null ? "" : f.getContent(),
                            StandardCharsets.UTF_8,
                            StandardOpenOption.CREATE,
                            StandardOpenOption.TRUNCATE_EXISTING
                    );
                }
            }

            log.info("Project {} created at {}", projectId, projectRoot);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create project directory structure", e);
        }
    }

    public void deleteProjectRootFromDisk(UUID projectId) {
        Path projectRoot = Paths.get(storageProperties.getProjects()).resolve(projectId.toString());
        try {
            if (Files.exists(projectRoot)) {
                try (Stream<Path> pathStream = Files.walk(projectRoot)) {
                    pathStream.sorted(Comparator.reverseOrder())
                            .forEach(p -> {
                                try {
                                    Files.delete(p);
                                } catch (Exception e) {
                                    // Ignore failure to delete individual files during cleanup
                                }
                            });
                }
            }
        } catch (Exception e) {
            log.error("Failed to delete project directory from disk: {}", e.getMessage(), e);
        }
    }
}

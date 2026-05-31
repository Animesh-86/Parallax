package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FileSyncServiceTest {

    @Mock
    private ProjectFileRepository projectFileRepository;

    @Mock
    private EntityManager entityManager;

    private FileSyncService fileSyncService;

    @TempDir
    Path tempBaseDir;

    @BeforeEach
    void setUp() {
        // Initialize service with TempDir path
        fileSyncService = new FileSyncService(projectFileRepository, tempBaseDir.toString());
        ReflectionTestUtils.setField(fileSyncService, "entityManager", entityManager);
    }

    @Test
    void sanitizeUserPath_ValidPaths() {
        assertEquals("src/main.py", fileSyncService.sanitizeUserPath("src/main.py"));
        assertEquals("src/main.py", fileSyncService.sanitizeUserPath("/src/main.py"));
        assertEquals("src/main.py", fileSyncService.sanitizeUserPath("src//main.py"));
        assertEquals("src/main.py", fileSyncService.sanitizeUserPath("src\\main.py"));
    }

    @Test
    void sanitizeUserPath_InvalidPaths() {
        assertThrows(IllegalArgumentException.class, () -> fileSyncService.sanitizeUserPath(""));
        assertThrows(IllegalArgumentException.class, () -> fileSyncService.sanitizeUserPath(null));
        assertThrows(IllegalArgumentException.class, () -> fileSyncService.sanitizeUserPath("../etc/passwd"));
        assertThrows(IllegalArgumentException.class, () -> fileSyncService.sanitizeUserPath("src/\0/main.py"));
    }
}

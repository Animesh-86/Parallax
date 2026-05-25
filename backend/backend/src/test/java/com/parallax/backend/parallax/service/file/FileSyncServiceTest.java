package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileSyncServiceTest {

    @Mock
    private ProjectFileRepository projectFileRepository;

    @Mock
    private EntityManager entityManager;

    private FileSyncService fileSyncService;

    @TempDir
    Path tempBaseDir;

    private UUID projectId;
    private String sessionId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        sessionId = "sess-123";
        // Initialize service with TempDir path
        fileSyncService = new FileSyncService(projectFileRepository, tempBaseDir.toString());
        ReflectionTestUtils.setField(fileSyncService, "entityManager", entityManager);
    }

    private ProjectFile createFile(String path, String type, String content) {
        ProjectFile file = new ProjectFile();
        ReflectionTestUtils.setField(file, "path", path);
        ReflectionTestUtils.setField(file, "type", type);
        ReflectionTestUtils.setField(file, "content", content);
        return file;
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

    @Test
    void syncProjectToSession_Success() throws IOException {
        ProjectFile file1 = createFile("src/main.py", "FILE", "print('hello')");
        ProjectFile folder1 = createFile("src/utils", "FOLDER", null);

        when(projectFileRepository.findByProjectId(projectId)).thenReturn(Arrays.asList(file1, folder1));

        fileSyncService.syncProjectToSession(projectId, sessionId);

        Path sessionDir = tempBaseDir.resolve(sessionId);
        assertTrue(Files.exists(sessionDir.resolve("src/main.py")));
        assertTrue(Files.exists(sessionDir.resolve("src/utils")));
        assertEquals("print('hello')", Files.readString(sessionDir.resolve("src/main.py")));
    }

    @Test
    void writeFileToSession_Success() throws IOException {
        fileSyncService.writeFileToSession(sessionId, "new.py", "test content");

        Path resolved = tempBaseDir.resolve(sessionId).resolve("new.py");
        assertTrue(Files.exists(resolved));
        assertEquals("test content", Files.readString(resolved));
    }

    @Test
    void writeProjectSnapshot_Success() throws IOException {
        ProjectFile file1 = createFile("main.py", "FILE", "print('snapshot')");
        when(projectFileRepository.findByProjectId(projectId)).thenReturn(Collections.singletonList(file1));
        doNothing().when(entityManager).clear();

        Path snapshotDir = tempBaseDir.resolve("snapshots").resolve(projectId.toString());
        
        fileSyncService.writeProjectSnapshot(projectId, snapshotDir);

        assertTrue(Files.exists(snapshotDir.resolve("main.py")));
        assertEquals("print('snapshot')", Files.readString(snapshotDir.resolve("main.py")));
        verify(entityManager).clear();
    }

    @Test
    void writeProjectSnapshot_NoFiles() {
        when(projectFileRepository.findByProjectId(projectId)).thenReturn(Collections.emptyList());
        doNothing().when(entityManager).clear();

        Path snapshotDir = tempBaseDir.resolve("snapshots").resolve(projectId.toString());

        assertThrows(IllegalStateException.class, () -> fileSyncService.writeProjectSnapshot(projectId, snapshotDir));
    }

    @Test
    void removeSessionFolder_Success() throws IOException {
        Path sessionDir = tempBaseDir.resolve(sessionId);
        Files.createDirectories(sessionDir.resolve("src"));
        Files.writeString(sessionDir.resolve("src/main.py"), "test");

        assertTrue(Files.exists(sessionDir));

        fileSyncService.removeSessionFolder(sessionId);

        assertFalse(Files.exists(sessionDir));
    }
}

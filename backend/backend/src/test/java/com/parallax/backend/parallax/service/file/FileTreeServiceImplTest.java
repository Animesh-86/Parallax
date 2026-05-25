package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.dto.file.FileNodeDto;
import com.parallax.backend.parallax.dto.file.NodeType;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileTreeServiceImplTest {

    @Mock
    private ProjectFileRepository projectFileRepository;

    @Mock
    private ProjectAccessManager accessManager;

    @Mock
    private FileSyncService fileSyncService;

    @InjectMocks
    private FileTreeServiceImpl fileTreeService;

    private UUID projectId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    private ProjectFile createFile(String path, String type, String content) {
        ProjectFile file = new ProjectFile();
        ReflectionTestUtils.setField(file, "path", path);
        ReflectionTestUtils.setField(file, "type", type);
        ReflectionTestUtils.setField(file, "content", content);
        return file;
    }

    @Test
    void getTree_Success() {
        // Arrange
        doNothing().when(accessManager).require(projectId, userId, ProjectPermission.READ_TREE);

        ProjectFile file1 = createFile("src/main.py", "FILE", "print('hello')");
        ProjectFile file2 = createFile("src/utils.py", "FILE", "def foo(): pass");
        ProjectFile file3 = createFile("README.md", "FILE", "# readme");

        when(projectFileRepository.findByProjectId(projectId)).thenReturn(Arrays.asList(file1, file2, file3));
        
        when(fileSyncService.sanitizeUserPath("src/main.py")).thenReturn("src/main.py");
        when(fileSyncService.sanitizeUserPath("src/utils.py")).thenReturn("src/utils.py");
        when(fileSyncService.sanitizeUserPath("README.md")).thenReturn("README.md");

        // Act
        List<FileNodeDto> tree = fileTreeService.getTree(projectId, userId);

        // Assert
        assertNotNull(tree);
        assertEquals(2, tree.size()); // "src" and "README.md"
        
        // Root: README.md
        FileNodeDto readme = tree.stream().filter(n -> n.getName().equals("README.md")).findFirst().get();
        assertEquals(NodeType.FILE, readme.getType());
        assertEquals("README.md", readme.getPath());

        // Root: src
        FileNodeDto src = tree.stream().filter(n -> n.getName().equals("src")).findFirst().get();
        assertEquals(NodeType.FOLDER, src.getType());
        assertEquals("src", src.getPath());
        assertNotNull(src.getChildren());
        assertEquals(2, src.getChildren().size()); // main.py, utils.py
        
        // Children of src
        FileNodeDto mainPy = src.getChildren().stream().filter(n -> n.getName().equals("main.py")).findFirst().get();
        assertEquals(NodeType.FILE, mainPy.getType());
        assertEquals("src/main.py", mainPy.getPath());
    }

    @Test
    void getTree_PermissionDenied() {
        doThrow(new RuntimeException("Denied")).when(accessManager).require(projectId, userId, ProjectPermission.READ_TREE);

        assertThrows(RuntimeException.class, () -> fileTreeService.getTree(projectId, userId));

        verify(projectFileRepository, never()).findByProjectId(any());
    }
}

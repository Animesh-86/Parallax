package com.parallax.backend.parallax.service.file;

import com.parallax.backend.parallax.dto.file.FileNodeDto;

import java.util.List;
import java.util.UUID;

public interface FileTreeService {
    List<FileNodeDto> getTree(UUID projectId, UUID userId);
}

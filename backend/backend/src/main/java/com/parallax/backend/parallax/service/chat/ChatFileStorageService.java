package com.parallax.backend.parallax.service.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ChatFileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
        "png", "jpg", "jpeg", "gif", "pdf", "txt", "csv", "log", "json", "yaml", "yml", "md",
        "zip", "tar", "gz", "rar", "7z", "doc", "docx", "xls", "xlsx", "ppt", "pptx"
    );

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or null");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..")) {
            throw new IllegalArgumentException("Invalid file name containing path traversal sequence");
        }

        String extension = "";
        int lastIndex = originalFilename.lastIndexOf('.');
        if (lastIndex > 0) {
            extension = originalFilename.substring(lastIndex + 1).toLowerCase();
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File extension '" + extension + "' is not allowed");
        }

        String contentType = file.getContentType();
        if (contentType != null) {
            String lowerContentType = contentType.toLowerCase();
            if (lowerContentType.contains("html") || lowerContentType.contains("javascript") || lowerContentType.contains("svg")) {
                throw new IllegalArgumentException("File content type '" + contentType + "' is not allowed");
            }
        }

        try {
            Path targetDir = Paths.get(uploadDir, "chat").toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String sanitizedOriginalName = originalFilename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
            String fileName = UUID.randomUUID().toString() + "_" + sanitizedOriginalName;
            Path targetPath = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath);

            return "/api/chat/files/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    public Path loadFile(String fileName) {
        Path base = Paths.get(uploadDir, "chat").toAbsolutePath().normalize();
        Path target = base.resolve(fileName).toAbsolutePath().normalize();
        if (!target.startsWith(base)) {
            throw new SecurityException("Path traversal detected");
        }
        return target;
    }
}

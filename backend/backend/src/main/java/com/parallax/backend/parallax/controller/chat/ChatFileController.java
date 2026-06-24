package com.parallax.backend.parallax.controller.chat;

import com.parallax.backend.parallax.entity.chat.MessageAttachment;
import com.parallax.backend.parallax.service.chat.ChatFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/chat/files")
@RequiredArgsConstructor
public class ChatFileController {

    private final ChatFileStorageService chatFileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<MessageAttachment> uploadFile(@RequestParam("file") MultipartFile file, org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = com.parallax.backend.parallax.security.AuthUtil.requireUserId(authentication);
        // We log the uploader for audit purposes
        org.slf4j.LoggerFactory.getLogger(ChatFileController.class).info("User {} uploaded file {}", userId, file.getOriginalFilename());
        
        String url = chatFileStorageService.storeFile(file);
        
        MessageAttachment attachment = MessageAttachment.builder()
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileUrl(url)
                .fileSize(file.getSize())
                .build();
                
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = com.parallax.backend.parallax.security.AuthUtil.requireUserId(authentication);
        try {
            Path filePath = chatFileStorageService.loadFile(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("application/octet-stream"))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}

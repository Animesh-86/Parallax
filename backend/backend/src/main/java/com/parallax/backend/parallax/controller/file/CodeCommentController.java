package com.parallax.backend.parallax.controller.file;

import com.parallax.backend.parallax.model.CodeComment;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.CodeCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.security.AuthUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/comments")
@RequiredArgsConstructor
public class CodeCommentController {

    private final CodeCommentRepository codeCommentRepository;
    private final ProjectAccessManager accessManager;

    @GetMapping
    public ResponseEntity<List<CodeComment>> getComments(
            @PathVariable UUID projectId,
            @RequestParam String filePath,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
        return ResponseEntity.ok(codeCommentRepository.findByProjectIdAndFilePath(projectId, filePath));
    }

    @PostMapping
    public ResponseEntity<CodeComment> addComment(
            @PathVariable UUID projectId,
            Authentication authentication,
            @RequestBody CommentRequest request
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE); // Allowed to comment if they can read
        
        CodeComment comment = new CodeComment();
        comment.setProjectId(projectId);
        comment.setAuthorUserId(userId);
        comment.setFilePath(request.filePath());
        comment.setLineNumber(request.lineNumber());
        comment.setContent(request.content());
        
        CodeComment saved = codeCommentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<Void> resolveComment(
            @PathVariable UUID projectId,
            @PathVariable UUID commentId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        accessManager.require(projectId, userId, ProjectPermission.READ_FILE);
        
        codeCommentRepository.findById(commentId).ifPresent(c -> {
            if (c.getProjectId().equals(projectId)) {
                c.setResolved(true);
                codeCommentRepository.save(c);
            }
        });
        return ResponseEntity.ok().build();
    }

    public record CommentRequest(String filePath, int lineNumber, String content) {}
}

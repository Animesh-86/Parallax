package com.parallax.backend.parallax.controller.file;

import com.parallax.backend.parallax.model.CodeComment;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.CodeCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/comments")
@RequiredArgsConstructor
public class CodeCommentController {

    private final CodeCommentRepository codeCommentRepository;

    @GetMapping
    public ResponseEntity<List<CodeComment>> getComments(
            @PathVariable UUID projectId,
            @RequestParam String filePath
    ) {
        return ResponseEntity.ok(codeCommentRepository.findByProjectIdAndFilePath(projectId, filePath));
    }

    @PostMapping
    public ResponseEntity<CodeComment> addComment(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user,
            @RequestBody CommentRequest request
    ) {
        CodeComment comment = new CodeComment();
        comment.setProjectId(projectId);
        comment.setAuthorUserId(user.getId());
        comment.setFilePath(request.filePath());
        comment.setLineNumber(request.lineNumber());
        comment.setContent(request.content());
        
        CodeComment saved = codeCommentRepository.save(comment);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{commentId}/resolve")
    public ResponseEntity<Void> resolveComment(
            @PathVariable UUID projectId,
            @PathVariable UUID commentId
    ) {
        codeCommentRepository.findById(commentId).ifPresent(c -> {
            c.setResolved(true);
            codeCommentRepository.save(c);
        });
        return ResponseEntity.ok().build();
    }

    public record CommentRequest(String filePath, int lineNumber, String content) {}
}

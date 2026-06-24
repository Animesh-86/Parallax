package com.parallax.backend.parallax.controller.ai;

import com.parallax.backend.parallax.dto.ai.AiChatRequest;
import com.parallax.backend.parallax.dto.ai.AiChatResponse;
import com.parallax.backend.parallax.service.ai.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request, org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = com.parallax.backend.parallax.security.AuthUtil.requireUserId(authentication);
        AiChatResponse response = aiChatService.chat(request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/autocomplete")
    public ResponseEntity<com.parallax.backend.parallax.dto.ai.AiAutocompleteResponse> autocomplete(@RequestBody com.parallax.backend.parallax.dto.ai.AiAutocompleteRequest request, org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = com.parallax.backend.parallax.security.AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(aiChatService.autocomplete(request, userId));
    }

    @PostMapping("/generate-commit-message")
    public ResponseEntity<AiChatResponse> generateCommitMessage(@RequestBody com.parallax.backend.parallax.dto.ai.AiCommitMessageRequest request, org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = com.parallax.backend.parallax.security.AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(aiChatService.generateCommitMessage(request, userId));
    }
}

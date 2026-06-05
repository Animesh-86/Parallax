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
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiChatService.chat(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/autocomplete")
    public ResponseEntity<com.parallax.backend.parallax.dto.ai.AiAutocompleteResponse> autocomplete(@RequestBody com.parallax.backend.parallax.dto.ai.AiAutocompleteRequest request) {
        return ResponseEntity.ok(aiChatService.autocomplete(request));
    }

    @PostMapping("/generate-commit-message")
    public ResponseEntity<AiChatResponse> generateCommitMessage(@RequestBody com.parallax.backend.parallax.dto.ai.AiCommitMessageRequest request) {
        return ResponseEntity.ok(aiChatService.generateCommitMessage(request));
    }
}

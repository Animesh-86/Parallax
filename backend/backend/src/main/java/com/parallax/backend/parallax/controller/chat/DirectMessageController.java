package com.parallax.backend.parallax.controller.chat;

import com.parallax.backend.parallax.entity.chat.DirectMessage;
import com.parallax.backend.parallax.service.chat.DirectMessageService;
import com.parallax.backend.parallax.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat/direct")
@RequiredArgsConstructor
public class DirectMessageController {

    private final DirectMessageService directMessageService;

    @GetMapping("/{friendId}")
    public ResponseEntity<List<DirectMessage>> getDirectMessages(
            @PathVariable UUID friendId,
            Principal principal) {
        
        UUID userId = AuthUtil.requireUserId(principal);
        List<DirectMessage> history = directMessageService.getChatHistory(userId, friendId);
        
        return ResponseEntity.ok(history);
    }
}

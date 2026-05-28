package com.parallax.backend.parallax.controller.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.parallax.backend.parallax.service.github.GitHubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/github/webhooks")
@RequiredArgsConstructor
@Slf4j
public class GitHubWebhookController {

    private final GitHubService gitHubService;

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String githubEvent,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody JsonNode payload) {

        log.info("Received GitHub Webhook Event: {}", githubEvent);

        if ("pull_request".equals(githubEvent)) {
            String action = payload.path("action").asText();
            if ("opened".equals(action) || "synchronize".equals(action)) {
                log.info("Processing PR event: {}", action);
                gitHubService.handlePullRequestEvent(payload);
            } else {
                log.info("Ignoring PR action: {}", action);
            }
        } else if ("ping".equals(githubEvent)) {
            log.info("Received ping event from GitHub");
            return ResponseEntity.ok("pong");
        }

        return ResponseEntity.ok("Webhook received");
    }
}

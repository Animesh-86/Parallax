package com.parallax.backend.parallax.controller.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.parallax.backend.parallax.service.github.GitHubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/github/webhooks")
@RequiredArgsConstructor
@Slf4j
public class GitHubWebhookController {

    private final GitHubService gitHubService;

    @Value("${github.webhook-secret:}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String githubEvent,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String rawPayload) {

        log.info("Received GitHub Webhook Event: {}", githubEvent);
        
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            log.error("GitHub Webhook secret is not configured. Rejecting webhook request.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Webhook integration is disabled or not configured.");
        }

        if (signature == null || signature.isEmpty()) {
            log.warn("Missing X-Hub-Signature-256 header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            StringBuilder expectedSignature = new StringBuilder("sha256=");
            for (byte b : hmacBytes) {
                expectedSignature.append(String.format("%02x", b));
            }
            
            byte[] expectedBytes = expectedSignature.toString().getBytes(StandardCharsets.UTF_8);
            byte[] actualBytes = signature.getBytes(StandardCharsets.UTF_8);

            if (!java.security.MessageDigest.isEqual(expectedBytes, actualBytes)) {
                log.warn("Invalid webhook signature.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }
        } catch (Exception e) {
            log.error("Error validating webhook signature", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error validating signature");
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            JsonNode payload = mapper.readTree(rawPayload);

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
        } catch (Exception e) {
            log.error("Error parsing webhook payload", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON payload");
        }
    }
}

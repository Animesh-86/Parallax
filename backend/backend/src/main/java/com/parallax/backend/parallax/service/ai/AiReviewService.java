package com.parallax.backend.parallax.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AiReviewService {

    private final ChatClient chatClient;
    private final RestTemplate restTemplate = new RestTemplate();
    private final com.parallax.backend.parallax.service.chat.TeamChatService teamChatService;
    private final com.parallax.backend.parallax.repository.team.TeamChannelRepository teamChannelRepository;

    public AiReviewService(ChatClient.Builder chatClientBuilder,
                           com.parallax.backend.parallax.service.chat.TeamChatService teamChatService,
                           com.parallax.backend.parallax.repository.team.TeamChannelRepository teamChannelRepository) {
        this.chatClient = chatClientBuilder.build();
        this.teamChatService = teamChatService;
        this.teamChannelRepository = teamChannelRepository;
    }

    @Async
    public void analyzeAndCommentAsync(com.parallax.backend.parallax.entity.project.Project project, String diffContent, String commentsUrl, String githubPat) {
        try {
            log.info("Starting AI Review analysis...");

            String systemPrompt = "You are an expert software engineer reviewing a pull request. " +
                    "Analyze the following git diff for bugs, anti-patterns, security vulnerabilities, and performance issues. " +
                    "Focus only on the changed lines. Provide a concise, constructive review. " +
                    "Do not nitpick minor style issues unless they violate obvious conventions. " +
                    "Format your response in Markdown.";

            String userPrompt = "Here is the diff:\n```diff\n" + diffContent + "\n```\nProvide your review.";

            String reviewComment = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();

            log.info("AI Review generated. Posting to GitHub PR...");
            postCommentToGitHub(reviewComment, commentsUrl, githubPat);
            
            if (project.getTeam() != null) {
                teamChannelRepository.findFirstByTeamIdAndIsDefaultTrue(project.getTeam().getId())
                        .ifPresent(channel -> {
                            teamChatService.systemMessage(project.getTeam().getId(), channel.getId(), 
                                    "🤖 **AI PR Review completed for " + project.getName() + "**:\n\n" + reviewComment);
                        });
            }
            
            log.info("AI Review posted successfully.");
        } catch (Exception e) {
            log.error("Error during AI PR review", e);
        }
    }

    private void postCommentToGitHub(String commentBody, String commentsUrl, String githubPat) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + githubPat);
            headers.set("Accept", "application/vnd.github.v3+json");
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("body", "### 🤖 AI PR Review (Parallax)\n\n" + commentBody);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(commentsUrl, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to post comment to GitHub. Status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error posting comment to GitHub API", e);
        }
    }
}

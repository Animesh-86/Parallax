package com.parallax.backend.parallax.service.ai;

import com.parallax.backend.parallax.dto.ai.AiChatRequest;
import com.parallax.backend.parallax.dto.ai.AiChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiChatService {

    private final ChatClient chatClient;

    public AiChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public AiChatResponse chat(AiChatRequest request) {
        try {
            String systemPrompt = "You are Parallax AI, an expert programming assistant built into the Parallax Cloud IDE. " +
                    "Your goal is to help the user write, debug, and understand code. " +
                    "Keep your answers concise and well-formatted using Markdown. " +
                    "If the user shares code context, use it to provide a highly relevant answer.";

            StringBuilder userPrompt = new StringBuilder();
            
            if (request.getActiveFileContent() != null && !request.getActiveFileContent().trim().isEmpty()) {
                userPrompt.append("Here is the content of the file I am currently looking at");
                if (request.getActiveFileName() != null) {
                    userPrompt.append(" (").append(request.getActiveFileName()).append(")");
                }
                userPrompt.append(":\n\n```\n");
                userPrompt.append(request.getActiveFileContent());
                userPrompt.append("\n```\n\n");
            }

            userPrompt.append("User's question:\n").append(request.getPrompt());

            String reply = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt.toString())
                    .call()
                    .content();

            return new AiChatResponse(reply);
        } catch (Exception e) {
            log.error("Error during AI Chat processing", e);
            throw new RuntimeException("AI processing failed", e);
        }
    }
}

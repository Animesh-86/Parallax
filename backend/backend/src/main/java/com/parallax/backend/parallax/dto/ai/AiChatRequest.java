package com.parallax.backend.parallax.dto.ai;

import lombok.Data;

@Data
public class AiChatRequest {
    private String prompt;
    private String activeFileContent;
    private String activeFileName;
}

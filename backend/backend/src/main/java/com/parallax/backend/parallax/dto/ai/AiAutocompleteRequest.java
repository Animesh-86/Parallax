package com.parallax.backend.parallax.dto.ai;

import lombok.Data;

@Data
public class AiAutocompleteRequest {
    private String prefix;
    private String suffix;
}

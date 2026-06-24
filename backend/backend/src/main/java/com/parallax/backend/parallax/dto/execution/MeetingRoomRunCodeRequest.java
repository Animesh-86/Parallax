package com.parallax.backend.parallax.dto.execution;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MeetingRoomRunCodeRequest {
    @NotBlank
    private String code;
    
    @NotBlank
    private String language;
}

package com.parallax.backend.parallax.dto.project;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProjectErrorMessage {
    private final String error;
    private final String message;
}

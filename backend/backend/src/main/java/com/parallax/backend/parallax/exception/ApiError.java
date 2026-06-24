package com.parallax.backend.parallax.exception;

import java.util.List;

public record ApiError(
        String code,          // SCREAMING_SNAKE: "PROJECT_NOT_FOUND"
        String message,       // Human-readable: "No project with ID 'abc' was found"
        int status,           // HTTP status code
        String timestamp,     // ISO 8601 UTC
        String path,          // Request path
        String requestId,     // UUID for log correlation
        List<FieldError> details  // For 422 only
) {
    public record FieldError(String field, String code, String message) {}
}

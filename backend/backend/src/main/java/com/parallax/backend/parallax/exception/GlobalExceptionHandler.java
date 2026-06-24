package com.parallax.backend.parallax.exception;

import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
                log.warn("Bad Request: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "bad_request",
                                                "message", ex.getMessage(),
                                                "timestamp", Instant.now().toString()));
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
                log.warn("Conflict: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(Map.of(
                                                "error", "conflict",
                                                "message", ex.getMessage(),
                                                "timestamp", Instant.now().toString()));
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
                log.warn("Not Found: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "not_found",
                                                "message", ex.getMessage(),
                                                "timestamp", Instant.now().toString()));
        }

        @ExceptionHandler(SecurityException.class)
        public ResponseEntity<Map<String, Object>> handleSecurity(SecurityException ex) {
                log.warn("Forbidden: {}", ex.getMessage());
                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(Map.of(
                                                "error", "forbidden",
                                                "message", ex.getMessage(),
                                                "timestamp", Instant.now().toString()));
        }
        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
                log.error("Unhandled runtime exception", ex);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of(
                                                "error", "internal_server_error",
                                                "message", ex.getMessage(),
                                                "timestamp", Instant.now().toString()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
                log.error("Unhandled exception", ex);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of(
                                                "error", "internal_server_error",
                                                "message", "An unexpected error occurred",
                                                "timestamp", Instant.now().toString()));
        }
}

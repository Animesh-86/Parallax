package com.parallax.backend.parallax.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldError> details = ex.getBindingResult()
                .getFieldErrors().stream()
                .map(f -> new ApiError.FieldError(f.getField(),
                        f.getCode(), f.getDefaultMessage()))
                .toList();
        return respond(422, "VALIDATION_FAILED",
                "Request validation failed", req, details);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest req) {
        return respond(404, "RESOURCE_NOT_FOUND", ex.getMessage(), req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest req) {
        return respond(403, "PERMISSION_DENIED",
                "You do not have permission for this action", req, null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(
            ForbiddenException ex, HttpServletRequest req) {
        return respond(403, "PERMISSION_DENIED",
                ex.getMessage(), req, null);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiError> handleSecurity(
            SecurityException ex, HttpServletRequest req) {
        return respond(403, "PERMISSION_DENIED",
                ex.getMessage(), req, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest req) {
        return respond(400, "BAD_REQUEST",
                ex.getMessage(), req, null);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(
            IllegalStateException ex, HttpServletRequest req) {
        return respond(409, "CONFLICT",
                ex.getMessage(), req, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedJson(
            HttpMessageNotReadableException ex, HttpServletRequest req) {
        return respond(400, "MALFORMED_REQUEST_BODY",
                "Request body is not valid JSON", req, null);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntime(
            RuntimeException ex, HttpServletRequest req) {
        log.error("Unhandled runtime exception on {}", req.getRequestURI(), ex);
        return respond(500, "INTERNAL_ERROR",
                "An unexpected error occurred", req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleCatchAll(
            Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception on {}", req.getRequestURI(), ex);
        return respond(500, "INTERNAL_ERROR",
                "An unexpected error occurred", req, null);
    }

    private ResponseEntity<ApiError> respond(
            int status, String code, String message,
            HttpServletRequest req, List<ApiError.FieldError> details) {
        String requestId = (String) req.getAttribute("requestId");
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }
        MDC.put("requestId", requestId);
        
        ApiError error = new ApiError(
                code, message, status,
                Instant.now().toString(),
                req.getRequestURI(),
                requestId, details);
                
        return ResponseEntity.status(status).body(error);
    }
}

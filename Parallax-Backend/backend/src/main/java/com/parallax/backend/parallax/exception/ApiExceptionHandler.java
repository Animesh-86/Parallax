package com.parallax.backend.parallax.exception;

public class ApiExceptionHandler extends RuntimeException {
    public ApiExceptionHandler(String message) {
        super(message);
    }
}

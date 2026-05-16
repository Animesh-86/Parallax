package com.parallax.backend.parallax.exception;

public class DockerCommandException extends RuntimeException {
    public DockerCommandException(String message) {
        super(message);
    }
}

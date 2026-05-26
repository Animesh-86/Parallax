package com.parallax.backend.parallax.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Validates that Docker is available and all required runner images exist
 * at application startup. Logs warnings/errors if any are missing —
 * preventing silent failures during code execution.
 */
@Component
public class DockerHealthCheck {

    private static final Logger log = LoggerFactory.getLogger(DockerHealthCheck.class);

    @Value("${code.runner.python-image:parallax-python-runner}")
    private String pythonImage;

    @Value("${code.runner.java-image:parallax-java-runner}")
    private String javaImage;

    @Value("${code.runner.js-image:parallax-js-runner}")
    private String jsImage;

    @Value("${code.runner.cpp-image:parallax-cpp-runner}")
    private String cppImage;

    @EventListener(ApplicationReadyEvent.class)
    public void checkDockerOnStartup() {
        log.info("🐳 Running Docker health check...");

        // 1. Check Docker daemon is running
        if (!isDockerAvailable()) {
            log.error("🔴 CRITICAL: Docker daemon is not running or not accessible! Code execution will fail.");
            log.error("   → Start Docker Desktop or the Docker daemon before running the backend.");
            return;
        }

        log.info("✅ Docker daemon is running");

        // 2. Check all required runner images exist
        List<String> requiredImages = List.of(pythonImage, javaImage, jsImage, cppImage);
        boolean allPresent = true;

        for (String image : requiredImages) {
            if (!imageExists(image)) {
                log.error("🔴 MISSING Docker image: '{}' — code execution for this language will fail!", image);
                log.error("   → Run: docker build -t {} <path-to-runner-dockerfile>", image);
                allPresent = false;
            } else {
                log.info("  ✅ Image found: {}", image);
            }
        }

        if (allPresent) {
            log.info("✅ All Docker runner images are available. Code execution is ready.");
        } else {
            log.warn("⚠️ Some runner images are missing. Run 'backend/build-runners.bat' to build them.");
        }
    }

    private boolean isDockerAvailable() {
        try {
            Process process = new ProcessBuilder("docker", "info")
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (Exception e) {
            log.debug("Docker availability check failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean imageExists(String imageName) {
        try {
            Process process = new ProcessBuilder("docker", "image", "inspect", imageName)
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (Exception e) {
            log.debug("Image check failed for {}: {}", imageName, e.getMessage());
            return false;
        }
    }
}

package com.parallax.backend.parallax.service.session;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;

@Component
public class SessionContainerCleanup {

    private static final Logger log = LoggerFactory.getLogger(SessionContainerCleanup.class);

    @PostConstruct
    public void cleanupOrphanContainers() {
        try {
            List<String> cmd = List.of(
                    "docker", "ps",
                    "--filter", "name=session_",
                    "--format", "{{.Names}}"
            );

            Process process = new ProcessBuilder(cmd)
                    .redirectErrorStream(true)
                    .start();

            try (BufferedReader reader =
                         new BufferedReader(new InputStreamReader(process.getInputStream()))) {

                String container;
                while ((container = reader.readLine()) != null) {
                    log.warn("🧹 Removing orphan container {}", container);
                    removeContainer(container);
                }
            }

            process.waitFor();

        } catch (Exception e) {
            log.error("Failed to cleanup orphan session containers", e);
        }
    }

    private void removeContainer(String name) {
        try {
            new ProcessBuilder("docker", "rm", "-f", name)
                    .redirectErrorStream(true)
                    .start()
                    .waitFor();
        } catch (Exception e) {
            log.error("Failed to remove container {}", name, e);
        }
    }
}

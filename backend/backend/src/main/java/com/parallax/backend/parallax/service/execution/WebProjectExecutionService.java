package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.config.StorageProperties;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WebProjectExecutionService {

    private static final Logger log = LoggerFactory.getLogger(WebProjectExecutionService.class);

    private final StorageProperties storageProperties;
    private final SessionRegistry sessionRegistry;
    
    // projectId -> containerId
    private final Map<UUID, String> runningContainers = new ConcurrentHashMap<>();
    // projectId -> mapped host port
    private final Map<UUID, Integer> projectPorts = new ConcurrentHashMap<>();

    public synchronized WebProjectStatus startServer(UUID projectId) {
        if (runningContainers.containsKey(projectId)) {
            return getServerStatus(projectId);
        }

        Path projectRoot = Paths.get(storageProperties.getProjects())
                .resolve(projectId.toString())
                .toAbsolutePath()
                .normalize();

        SessionRegistry.SessionInfo session = sessionRegistry.getByProject(projectId);
        if (session == null || session.getContainerName() == null) {
            throw new RuntimeException("No active workspace session found for this project.");
        }

        try {
            // Detect package.json to support monorepos (e.g. Next.js app in 'frontend/' folder)
            String workingDir = "/workspace";
            String runCmd = "npm install && env HOST=0.0.0.0 HOSTNAME=0.0.0.0 npm run dev";
            
            Path packageJsonRoot = projectRoot.resolve("package.json");
            if (!Files.exists(packageJsonRoot)) {
                // Try searching one level deep
                try {
                    var found = Files.list(projectRoot)
                            .filter(Files::isDirectory)
                            .map(dir -> dir.resolve("package.json"))
                            .filter(Files::exists)
                            .findFirst();
                    if (found.isPresent()) {
                        String subDir = projectRoot.relativize(found.get().getParent()).toString().replace("\\", "/");
                        workingDir = "/workspace/" + subDir;
                    }
                } catch (Exception e) {
                    log.warn("Error scanning for package.json", e);
                }
            }

            List<String> cmd = new ArrayList<>();
            cmd.add("docker");
            cmd.add("exec");
            cmd.add("-d");
            cmd.add("-w");
            cmd.add(workingDir);
            cmd.add(session.getContainerName());
            cmd.add("sh");
            cmd.add("-c");
            // Install dependencies and start dev server
            cmd.add(runCmd);

            log.info("Starting web project {}: {}", projectId, String.join(" ", cmd));
            
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor();

            log.info("Web project {} started in workspace container {}", projectId, session.getContainerName());
            runningContainers.put(projectId, session.getContainerName());
            Integer mappedPort = session.getWebPort();
            if (mappedPort != null) {
                projectPorts.put(projectId, mappedPort);
            }
            return new WebProjectStatus("RUNNING", mappedPort);
            
        } catch (Exception e) {
            log.error("Failed to start web project server", e);
            throw new RuntimeException("Failed to start web project", e);
        }
    }

    public synchronized void stopServer(UUID projectId) {
        String containerId = runningContainers.get(projectId);
        if (containerId != null) {
            try {
                log.info("Stopping web project {} (killing node in container {})", projectId, containerId);
                Process process = new ProcessBuilder("docker", "exec", containerId, "pkill", "-f", "node").start();
                process.waitFor();
            } catch (Exception e) {
                log.error("Failed to stop container {}", containerId, e);
            } finally {
                runningContainers.remove(projectId);
                projectPorts.remove(projectId);
            }
        }
    }

    public WebProjectStatus getServerStatus(UUID projectId) {
        if (runningContainers.containsKey(projectId)) {
            // Optional: verify with docker inspect if it's actually running
            return new WebProjectStatus("RUNNING", projectPorts.get(projectId));
        }
        return new WebProjectStatus("STOPPED", null);
    }

    private int findAvailablePort() throws Exception {
        // Simple port finder using ServerSocket
        try (java.net.ServerSocket socket = new java.net.ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    public static class WebProjectStatus {
        private final String status;
        private final Integer port;

        public WebProjectStatus(String status, Integer port) {
            this.status = status;
            this.port = port;
        }

        public String getStatus() { return status; }
        public Integer getPort() { return port; }
    }
}

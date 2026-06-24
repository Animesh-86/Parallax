package com.parallax.backend.parallax.service.session;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.file.FileSyncService;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class SessionService {

    private static final Logger LOG =
            LoggerFactory.getLogger(SessionService.class);

    private static final int DOCKER_TIMEOUT_SEC = 120;

    private final ProjectRepository projectRepo;
    private final FileSyncService fileSyncService;
    private final SessionRegistry sessionRegistry;
    private final ProjectAccessManager accessManager;
    private final com.parallax.backend.parallax.config.StorageProperties storageProperties;
    private final com.parallax.backend.parallax.config.ContainerSecurityPolicy containerSecurityPolicy;
    private final com.parallax.backend.parallax.config.SecurityAuditLogger auditLogger;

    @Value("${code.session.image-name:parallax-collab}")
    private String sessionImage;

    private final ConcurrentHashMap<UUID, Lock> projectLocks = new ConcurrentHashMap<>();

    private Lock getProjectLock(UUID projectId) {
        return projectLocks.computeIfAbsent(projectId, k -> new ReentrantLock());
    }

    public SessionService(
            ProjectRepository projectRepo,
            FileSyncService fileSyncService,
            SessionRegistry sessionRegistry,
            ProjectAccessManager accessManager,
            com.parallax.backend.parallax.config.StorageProperties storageProperties,
            com.parallax.backend.parallax.config.ContainerSecurityPolicy containerSecurityPolicy,
            com.parallax.backend.parallax.config.SecurityAuditLogger auditLogger
    ) {
        this.projectRepo = projectRepo;
        this.fileSyncService = fileSyncService;
        this.sessionRegistry = sessionRegistry;
        this.accessManager = accessManager;
        this.storageProperties = storageProperties;
        this.containerSecurityPolicy = containerSecurityPolicy;
        this.auditLogger = auditLogger;
    }

    // START SESSION (IDEMPOTENT)
    public String startSession(UUID projectId, UUID userId) throws Exception {

        accessManager.require(projectId, userId, ProjectPermission.START_SESSION);

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Optional<String> existing =
                sessionRegistry.getSessionIdForProject(projectId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Limit maximum active sessions per user (MED-06)
        long activeCount = sessionRegistry.getSessionCountForUser(userId);
        if (activeCount >= 5) {
            throw new IllegalStateException("Maximum limit of 5 active sessions reached. Stop an existing session before starting a new one.");
        }

        Lock lock = getProjectLock(projectId);
        lock.lock();
        try {

            Optional<String> second =
                    sessionRegistry.getSessionIdForProject(projectId);
            if (second.isPresent()) {
                return second.get();
            }

            String sessionId = UUID.randomUUID().toString();
            String containerName = "session_" + sessionId;
            int webPort = findAvailablePort();

            LOG.info("Starting session {} for project {} with webPort {}", sessionId, projectId, webPort);

            try {
                // Ensure the permanent project directory exists
                java.nio.file.Path projectPath = java.nio.file.Paths.get(storageProperties.getProjects())
                        .resolve(projectId.toString())
                        .toAbsolutePath()
                        .normalize();
                java.nio.file.Files.createDirectories(projectPath);

                String hostMount = projectPath.toString().replace("\\", "/");

                String output;
                String[] dockerArgs = buildSecureDockerArgs(
                        containerName, hostMount, webPort, projectId
                );

                // 🔒 Validate command against security policy before execution
                containerSecurityPolicy.validateDockerCommand(dockerArgs);

                try {
                    output = runCommand(DOCKER_TIMEOUT_SEC, dockerArgs);
                } catch (RuntimeException e) {
                    if (e.getMessage().contains("Unable to find image")) {
                        LOG.info("Docker image missing. Pulling {}...", sessionImage);
                        runCommand(DOCKER_TIMEOUT_SEC * 2,
                                "docker", "pull", sessionImage);
                        output = runCommand(DOCKER_TIMEOUT_SEC, dockerArgs);
                    } else {
                        throw e;
                    }
                }

                LOG.info("Docker container started: {}", output);

                sessionRegistry.register(
                        projectId,
                        sessionId,
                        containerName,
                        userId,
                        project.getLanguage(),
                        webPort
                );

                // 🔒 Audit: container started
                auditLogger.log(
                        com.parallax.backend.parallax.config.SecurityAuditLogger.AuditEvent.CONTAINER_STARTED,
                        userId, projectId,
                        java.util.Map.of("containerName", containerName, "sessionId", sessionId, "webPort", webPort)
                );

                return sessionId;

            } catch (Exception e) {
                LOG.error("Session start failed for project {}", projectId, e);
                try { runCommand(10, "docker", "rm", "-f", containerName); } catch (Exception ex) { LOG.warn("Failed to aggressively clean up container: " + containerName, ex); }
                throw e;
            }
        } finally {
            lock.unlock();
        }
    }

    // STOP SESSION
    public void stopSession(String sessionId, UUID requesterId) throws Exception {

        SessionRegistry.SessionInfo info =
                sessionRegistry.getBySessionId(sessionId);

        if (info == null) return;

        accessManager.require(
                info.getProjectId(),
                requesterId,
                ProjectPermission.STOP_SESSION
        );

        runCommand(DOCKER_TIMEOUT_SEC,
                "docker", "rm", "-f", info.getContainerName());

        // 🔒 Audit: container stopped
        auditLogger.log(
                com.parallax.backend.parallax.config.SecurityAuditLogger.AuditEvent.CONTAINER_STOPPED,
                requesterId, info.getProjectId(),
                java.util.Map.of("containerName", info.getContainerName(), "sessionId", sessionId)
        );

        sessionRegistry.remove(sessionId);
    }

    // INTERNAL — Single source of truth for hardened Docker container configuration
    private String[] buildSecureDockerArgs(
            String containerName, String hostMount, int webPort, UUID projectId
    ) {
        return new String[]{
                "docker", "run", "-d",
                "--name", containerName,
                "--network", "parallax-workspace-network",
                // ── Resource Limits (cgroups v2) ──
                "--memory", "512m",
                "--memory-swap", "512m",        // No swap abuse
                "--cpus", "0.5",
                "--pids-limit", "256",           // Fork bomb protection
                "--ulimit", "nofile=1024:2048",  // File descriptor limit
                "--ulimit", "nproc=256:256",     // Redundant fork protection
                // ── Security Hardening ──
                "--read-only",                   // Immutable root filesystem
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=100m",
                "--tmpfs", "/home/runner:rw,nosuid,size=50m",  // Writable home dir
                "--security-opt", "no-new-privileges:true",    // No SUID escalation
                "--cap-drop", "ALL",             // Drop all 38 Linux capabilities
                "--user", "1000:1000",           // Non-root user
                "--ipc", "none",                 // No shared memory with other containers
                // ── Web Preview Port ──
                "-p", webPort + ":3000",
                // ── Traefik Labels ──
                "-l", "traefik.enable=true",
                "-l", "traefik.http.routers.proj-" + projectId + ".rule=Host(`" + projectId + ".parallax.run`)",
                "-l", "traefik.http.services.proj-" + projectId + ".loadbalancer.server.port=3000",
                // ── Volume ──
                "-v", hostMount + ":/workspace",
                sessionImage,
                "tail", "-f", "/dev/null"
        };
    }

    private int findAvailablePort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (Exception e) {
            throw new RuntimeException("Could not find an available port", e);
        }
    }

    private String runCommand(int timeoutSec, String... cmd) throws Exception {

        Process p = new ProcessBuilder(cmd)
                .redirectErrorStream(true)
                .start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader r =
                     new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = r.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        boolean finished = p.waitFor(timeoutSec, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new RuntimeException("Command timed out: " + String.join(" ", cmd));
        }

        if (p.exitValue() != 0) {
            throw new RuntimeException(
                    "Command failed (" + p.exitValue() + "): "
                            + String.join(" ", cmd)
                            + "\nOutput:\n" + output
            );
        }

        return output.toString().trim();
    }
}

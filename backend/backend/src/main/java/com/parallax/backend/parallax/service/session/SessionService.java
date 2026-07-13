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
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Volume;
import com.github.dockerjava.api.model.PortBinding;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.TmpfsOptions;
import com.github.dockerjava.api.exception.NotFoundException;

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
    private final DockerClient dockerClient;

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
            com.parallax.backend.parallax.config.SecurityAuditLogger auditLogger,
            DockerClient dockerClient
    ) {
        this.projectRepo = projectRepo;
        this.fileSyncService = fileSyncService;
        this.sessionRegistry = sessionRegistry;
        this.accessManager = accessManager;
        this.storageProperties = storageProperties;
        this.containerSecurityPolicy = containerSecurityPolicy;
        this.auditLogger = auditLogger;
        this.dockerClient = dockerClient;
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

                // Ensure image is pulled
                try {
                    dockerClient.inspectImageCmd(sessionImage).exec();
                } catch (NotFoundException e) {
                    LOG.info("Docker image missing. Pulling {}...", sessionImage);
                    dockerClient.pullImageCmd(sessionImage).start().awaitCompletion(DOCKER_TIMEOUT_SEC * 2, TimeUnit.SECONDS);
                }

                HostConfig hostConfig = HostConfig.newHostConfig()
                    .withNetworkMode("parallax-workspace-network")
                    .withMemory(512L * 1024 * 1024)
                    .withMemorySwap(512L * 1024 * 1024)
                    .withNanoCPUs(500000000L) // 0.5 CPU
                    .withPidsLimit(256L)
                    .withUlimits(java.util.Arrays.asList(
                        new Ulimit("nofile", 1024, 2048),
                        new Ulimit("nproc", 256, 256)
                    ))
                    .withReadonlyRootfs(true)
                    .withTmpFs(java.util.Map.of(
                        "/tmp", "rw,noexec,nosuid,size=100m",
                        "/home/runner", "rw,nosuid,size=50m"
                    ))
                    .withSecurityOpts(java.util.Arrays.asList("no-new-privileges:true"))
                    .withCapDrop(Capability.ALL)
                    .withIpcMode("none")
                    .withPortBindings(PortBinding.parse(webPort + ":3000"))
                    .withBinds(new Bind(hostMount, new Volume("/workspace")));

                CreateContainerResponse container = dockerClient.createContainerCmd(sessionImage)
                    .withName(containerName)
                    .withUser("1000:1000")
                    .withLabels(java.util.Map.of(
                        "traefik.enable", "true",
                        "traefik.http.routers.proj-" + projectId + ".rule", "Host(`" + projectId + ".parallax.run`)",
                        "traefik.http.services.proj-" + projectId + ".loadbalancer.server.port", "3000"
                    ))
                    .withHostConfig(hostConfig)
                    .withCmd("tail", "-f", "/dev/null")
                    .exec();

                dockerClient.startContainerCmd(container.getId()).exec();
                LOG.info("Docker container started: {}", container.getId());

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
                try { dockerClient.removeContainerCmd(containerName).withForce(true).exec(); } catch (Exception ex) { LOG.warn("Failed to aggressively clean up container: " + containerName, ex); }
                throw e;
            }
        } finally {
            lock.unlock();
        }
    }
    public void stopSession(String sessionId, UUID requesterId) throws Exception {

        SessionRegistry.SessionInfo info =
                sessionRegistry.getBySessionId(sessionId);

        if (info == null) return;

        accessManager.require(
                info.getProjectId(),
                requesterId,
                ProjectPermission.STOP_SESSION
        );

        try {
            dockerClient.removeContainerCmd(info.getContainerName())
                .withForce(true)
                .exec();
        } catch (NotFoundException e) {
            LOG.warn("Container {} already removed", info.getContainerName());
        }

        // 🔒 Audit: container stopped
        auditLogger.log(
                com.parallax.backend.parallax.config.SecurityAuditLogger.AuditEvent.CONTAINER_STOPPED,
                requesterId, info.getProjectId(),
                java.util.Map.of("containerName", info.getContainerName(), "sessionId", sessionId)
        );

        sessionRegistry.remove(sessionId);
    }

    private int findAvailablePort() {
        try (java.net.ServerSocket socket = new java.net.ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (Exception e) {
            throw new RuntimeException("Could not find an available port", e);
        }
    }
}

package com.parallax.backend.parallax.service.queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildQueueService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean running = true;

    private static final String QUEUE_KEY = "parallax:build-queue";

    public void enqueueJob(UUID projectId, String jobType, String payload) {
        try {
            BuildJob job = new BuildJob(projectId, jobType, payload);
            String json = objectMapper.writeValueAsString(job);
            redisTemplate.opsForList().rightPush(QUEUE_KEY, json);
            log.info("Queued build job for project {}: {}", projectId, jobType);
        } catch (Exception e) {
            log.error("Failed to enqueue build job", e);
        }
    }

    @PostConstruct
    public void startWorker() {
        worker.submit(() -> {
            log.info("Started Redis Build Queue Worker");
            while (running) {
                try {
                    String json = redisTemplate.opsForList().leftPop(QUEUE_KEY, Duration.ofSeconds(5));
                    if (json != null) {
                        BuildJob job = objectMapper.readValue(json, BuildJob.class);
                        processJob(job);
                    }
                } catch (Exception e) {
                    if (running) {
                        log.error("Error polling build queue", e);
                        try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
                    }
                }
            }
        });
    }

    @PreDestroy
    public void stopWorker() {
        running = false;
        worker.shutdownNow();
    }

    private void processJob(BuildJob job) {
        log.info("🚀 Processing job: {} for project {}", job.type(), job.projectId());
        try {
            // Simulated build work (e.g., heavy docker build or npm install)
            Thread.sleep(3000);
            log.info("✅ Finished job: {}", job.type());
        } catch (Exception e) {
            log.error("Job failed: {}", job.type(), e);
        }
    }

    public record BuildJob(UUID projectId, String type, String payload) {}
}

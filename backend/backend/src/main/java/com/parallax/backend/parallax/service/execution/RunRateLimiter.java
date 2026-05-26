package com.parallax.backend.parallax.service.execution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class RunRateLimiter {

    private static final Logger log =
            LoggerFactory.getLogger(RunRateLimiter.class);

    // Tune this safely
    private static final int MAX_RUNS_PER_MINUTE = 5;
    private static final long WINDOW_SECONDS = 60;

    // Maximum age for an entry with no recent runs before eviction (10 minutes)
    private static final long STALE_ENTRY_SECONDS = 600;

    // projectId -> timestamps
    private final Map<UUID, Deque<Instant>> runs = new ConcurrentHashMap<>();

    public boolean allow(UUID projectId) {
        Instant now = Instant.now();

        Deque<Instant> timestamps =
                runs.computeIfAbsent(projectId, k -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            // remove old entries
            while (!timestamps.isEmpty() &&
                    timestamps.peekFirst()
                            .plusSeconds(WINDOW_SECONDS)
                            .isBefore(now)) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_RUNS_PER_MINUTE) {
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    /**
     * Periodic cleanup of stale rate limit entries to prevent memory leaks.
     * Runs every 10 minutes. Removes entries for projects with no recent runs.
     */
    @Scheduled(fixedRate = 600_000) // every 10 minutes
    public void cleanupStaleEntries() {
        Instant cutoff = Instant.now().minusSeconds(STALE_ENTRY_SECONDS);
        int removed = 0;

        for (Map.Entry<UUID, Deque<Instant>> entry : runs.entrySet()) {
            Deque<Instant> timestamps = entry.getValue();
            synchronized (timestamps) {
                // Evict expired entries first
                while (!timestamps.isEmpty() &&
                        timestamps.peekFirst()
                                .plusSeconds(WINDOW_SECONDS)
                                .isBefore(Instant.now())) {
                    timestamps.pollFirst();
                }
                // If empty and no recent activity, remove the entire entry
                if (timestamps.isEmpty()) {
                    runs.remove(entry.getKey());
                    removed++;
                }
            }
        }

        if (removed > 0) {
            log.debug("Cleaned up {} stale rate limit entries. Remaining: {}",
                    removed, runs.size());
        }
    }
}

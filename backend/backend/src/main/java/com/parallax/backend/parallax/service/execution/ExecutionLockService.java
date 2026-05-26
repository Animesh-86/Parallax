package com.parallax.backend.parallax.service.execution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ExecutionLockService {

    private static final Logger log =
            LoggerFactory.getLogger(ExecutionLockService.class);

    /**
     * Each lock entry tracks:
     * - locked: whether execution is in progress
     * - lastUsed: when the lock was last acquired (for cleanup)
     */
    private record LockEntry(AtomicBoolean locked, Instant lastUsed) {
        LockEntry() {
            this(new AtomicBoolean(false), Instant.now());
        }
    }

    private final ConcurrentHashMap<UUID, LockEntry> locks =
            new ConcurrentHashMap<>();

    // Maximum age for unused lock entries (5 minutes)
    private static final long STALE_ENTRY_SECONDS = 300;

    public boolean tryLock(UUID projectId) {
        LockEntry entry = locks.computeIfAbsent(projectId, k -> new LockEntry());
        boolean acquired = entry.locked().compareAndSet(false, true);
        if (acquired) {
            // Update lastUsed timestamp
            locks.put(projectId, new LockEntry(entry.locked(), Instant.now()));
        }
        return acquired;
    }

    public void unlock(UUID projectId) {
        LockEntry entry = locks.get(projectId);
        if (entry != null) {
            entry.locked().set(false);
        }
    }

    /**
     * Periodic cleanup of stale lock entries to prevent memory leaks.
     * Runs every 5 minutes. Only removes entries that are:
     * 1. Not currently locked
     * 2. Haven't been used in STALE_ENTRY_SECONDS
     */
    @Scheduled(fixedRate = 300_000) // every 5 minutes
    public void cleanupStaleLocks() {
        Instant cutoff = Instant.now().minusSeconds(STALE_ENTRY_SECONDS);
        int removed = 0;

        for (Map.Entry<UUID, LockEntry> e : locks.entrySet()) {
            LockEntry entry = e.getValue();
            // Only evict if NOT locked AND stale
            if (!entry.locked().get() && entry.lastUsed().isBefore(cutoff)) {
                locks.remove(e.getKey());
                removed++;
            }
        }

        if (removed > 0) {
            log.debug("Cleaned up {} stale execution lock entries. Remaining: {}",
                    removed, locks.size());
        }
    }
}

package com.parallax.backend.parallax.presence;

import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class PresenceCleanupTask {

    private final SessionRegistry sessionRegistry;

    public PresenceCleanupTask(SessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    @Scheduled(fixedDelay = 10_000)
    public void cleanup() {
        sessionRegistry.cleanupStalePresence();
    }
}

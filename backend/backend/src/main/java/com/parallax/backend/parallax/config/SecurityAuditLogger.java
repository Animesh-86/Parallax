package com.parallax.backend.parallax.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Server-side, tamper-proof audit logger for security-relevant events.
 *
 * <p>All events are logged as structured JSON to a dedicated logger named
 * "SECURITY_AUDIT". Configure this logger in logback-spring.xml to write
 * to a separate, append-only log file that is inaccessible to containers.</p>
 *
 * <p>Events are fire-and-forget — failures to log are caught and reported
 * via the standard application log, but never thrown to the caller.</p>
 */
@Component
public class SecurityAuditLogger {

    /**
     * Dedicated audit logger — configure separately in logback for
     * file rotation, retention, and tamper protection.
     */
    private static final Logger AUDIT_LOG =
            LoggerFactory.getLogger("SECURITY_AUDIT");

    private static final Logger log =
            LoggerFactory.getLogger(SecurityAuditLogger.class);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Categorized security events for structured auditing.
     */
    public enum AuditEvent {
        // Container lifecycle
        CONTAINER_STARTED,
        CONTAINER_STOPPED,
        CONTAINER_LAUNCH_BLOCKED,

        // Code execution
        CODE_EXECUTED,
        CODE_EXECUTION_DENIED,
        CODE_EXECUTION_TIMEOUT,

        // Terminal
        TERMINAL_SESSION_OPENED,
        TERMINAL_SESSION_CLOSED,

        // Access control
        ACCESS_DENIED,
        UNAUTHORIZED_ACCESS_ATTEMPT,
        PERMISSION_ESCALATION_BLOCKED,

        // Rate limiting
        RATE_LIMIT_EXCEEDED,

        // File operations
        FILE_UPLOADED,
        FILE_DOWNLOADED,

        // Authentication
        LOGIN_SUCCESS,
        LOGIN_FAILURE,
        JWT_VALIDATION_FAILURE
    }

    /**
     * Logs a security audit event as structured JSON.
     *
     * @param event     the event type
     * @param userId    the user who triggered the event (nullable for system events)
     * @param projectId the project context (nullable)
     * @param metadata  additional key-value pairs for context
     */
    public void log(AuditEvent event, UUID userId, UUID projectId, Map<String, Object> metadata) {
        try {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("timestamp", Instant.now().toString());
            entry.put("event", event.name());
            entry.put("userId", userId != null ? userId.toString() : null);
            entry.put("projectId", projectId != null ? projectId.toString() : null);
            if (metadata != null && !metadata.isEmpty()) {
                entry.put("metadata", metadata);
            }

            AUDIT_LOG.info(MAPPER.writeValueAsString(entry));
        } catch (Exception e) {
            // Never throw from audit logging — silently degrade
            log.error("Failed to write audit log for event {}", event, e);
        }
    }

    /**
     * Convenience overload for events with no extra metadata.
     */
    public void log(AuditEvent event, UUID userId, UUID projectId) {
        log(event, userId, projectId, null);
    }
}

package com.parallax.backend.parallax.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Centralized security policy for Docker container launches.
 * Validates that no container is launched with dangerous flags and
 * ensures mandatory security flags are always present.
 *
 * <p>This acts as a guard rail: even if a developer forgets a flag
 * in the docker run args, this class will catch it before the
 * container is created.</p>
 */
@Component
public class ContainerSecurityPolicy {

    private static final Logger log = LoggerFactory.getLogger(ContainerSecurityPolicy.class);

    /**
     * Docker flags that must NEVER appear in any container launch.
     * Each is checked as a prefix match against command arguments.
     */
    private static final Set<String> BLOCKED_FLAG_PREFIXES = Set.of(
            "--privileged",
            "--cap-add",
            "--device",
            "--pid=host",
            "--network=host",
            "--ipc=host",
            "--userns=host",
            "--security-opt=apparmor=unconfined",
            "--security-opt=seccomp=unconfined"
    );

    /**
     * Docker flags that MUST be present (at least as substrings)
     * in every container launch command.
     */
    private static final List<String> REQUIRED_FLAGS = List.of(
            "--cap-drop",
            "--user",
            "--pids-limit"
    );

    /**
     * Validates that a docker run command does not contain dangerous flags
     * and does contain all mandatory security flags.
     *
     * @param cmd the full docker run command as an array
     * @throws SecurityException if the command violates policy
     */
    public void validateDockerCommand(String[] cmd) {
        List<String> args = Arrays.asList(cmd);

        // Check for blocked flags
        for (String arg : args) {
            for (String blocked : BLOCKED_FLAG_PREFIXES) {
                if (arg.startsWith(blocked)) {
                    log.error("🚨 BLOCKED: Container launch with prohibited flag: {}", blocked);
                    throw new SecurityException(
                            "Container launch blocked: prohibited flag '" + blocked + "'"
                    );
                }
            }
        }

        // Check for required flags
        for (String required : REQUIRED_FLAGS) {
            boolean found = args.stream().anyMatch(a -> a.startsWith(required));
            if (!found) {
                log.error("🚨 BLOCKED: Container launch missing required flag: {}", required);
                throw new SecurityException(
                        "Container launch blocked: missing required flag '" + required + "'"
                );
            }
        }

        log.debug("✅ Container security policy validated for: {}", args.get(3)); // --name value
    }
}

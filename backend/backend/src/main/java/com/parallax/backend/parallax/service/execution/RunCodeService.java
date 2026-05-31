package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.CommandResult;
import com.parallax.backend.parallax.entity.file.ProjectFile;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.security.ProjectAccessManager;
import com.parallax.backend.parallax.security.ProjectPermission;
import com.parallax.backend.parallax.service.file.FileSyncService;
import com.parallax.backend.parallax.store.SessionRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RunCodeService {

    private static final Logger log =
            LoggerFactory.getLogger(RunCodeService.class);

    private final SessionRegistry sessionRegistry;
    private final ProjectAccessManager accessManager;
    private final FileSyncService fileSyncService;
    private final ProjectFileRepository fileRepo;
    private final RunRateLimiter runRateLimiter;
    private final ExecutionLockService executionLockService;
    private final ExecutionCoordinator executionCoordinator;

    @Value("${code.runner.max-output-bytes:131072}")
    private int maxOutputBytes;

    @Value("${code.runner.python-image:parallax-python-runner}")
    private String pythonRunnerImage;

    @Value("${code.runner.java-image:parallax-java-runner}")
    private String javaRunnerImage;

    @Value("${code.runner.js-image:parallax-js-runner}")
    private String jsRunnerImage;

    @Value("${code.runner.cpp-image:parallax-cpp-runner}")
    private String cppRunnerImage;

    /**
     * Validates that a filename contains only safe characters.
     * Prevents command injection via shell metacharacters in filenames.
     */
    private static final java.util.regex.Pattern SAFE_FILENAME_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9._/\\-]+$");

    private void validateFilenameForExecution(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }
        if (!SAFE_FILENAME_PATTERN.matcher(path).matches()) {
            throw new IllegalArgumentException(
                    "Filename contains invalid characters. Only alphanumeric, dots, underscores, hyphens, and slashes are allowed."
            );
        }
    }

    public CommandResult runCodeInSession(
            String sessionId,
            String filename,
            int timeoutSeconds,
            UUID userId,
            RunOutputSink sink
    ) throws Exception {

        SessionRegistry.SessionInfo session =
                sessionRegistry.getBySessionId(sessionId);

        if (session == null) {
            throw new ResourceNotFoundException("Session not found");
        }

        UUID projectId = session.getProjectId();
        String language = session.getLanguage();

        if (!runRateLimiter.allow(projectId)) {
            return new CommandResult(-1, "Run limit exceeded");
        }

        if (!executionLockService.tryLock(projectId)) {
            return new CommandResult(-1, "Another execution is running");
        }

        try {
            accessManager.require(projectId, userId, ProjectPermission.EXECUTE_CODE);

            final String safePath =
                    fileSyncService.sanitizeUserPath(filename);

            // 🔒 Validate filename against whitelist to prevent command injection
            validateFilenameForExecution(safePath);

            // 🔒 Ensure file exists & is runnable
            ProjectFile file =
                    fileRepo.findByProjectIdAndPath(projectId, safePath);

            if (file == null || !"FILE".equalsIgnoreCase(file.getType())) {
                throw new ResourceNotFoundException(
                        "Runnable file not found: " + safePath
                );
            }

            try {
                // Flush editor → DB → FS
                executionCoordinator.flushBeforeExecution(projectId);

                // Dynamic Language Detection based on filename
                String detectedLanguage = detectLanguage(safePath, session.getLanguage());
                sink.onOutput("[parallax-debug-v5] filename: " + safePath);
                sink.onOutput("[parallax-debug-v5] detectedLanguage: " + detectedLanguage);
                log.info("🔍 Detected language for {}: {}", safePath, detectedLanguage);

                List<String> cmd = new ArrayList<>();
                cmd.add("docker");
                cmd.add("exec");
                cmd.add("-i");
                cmd.add(session.getContainerName());

                if ("python".equalsIgnoreCase(detectedLanguage)) {
                    sink.onOutput("[parallax] Active Runner: Workspace Python 3");
                    cmd.add("python3");
                    cmd.add(safePath);
                } else if ("java".equalsIgnoreCase(detectedLanguage)) {
                    sink.onOutput("[parallax] Active Runner: Workspace OpenJDK 17");
                    cmd.add("java");
                    cmd.add(safePath);
                } else if ("javascript".equalsIgnoreCase(detectedLanguage) || "typescript".equalsIgnoreCase(detectedLanguage)) {
                    sink.onOutput("[parallax] Active Runner: Workspace Node.js");
                    cmd.add("node");
                    cmd.add(safePath);
                } else if ("c".equalsIgnoreCase(detectedLanguage)) {
                    sink.onOutput("[parallax] Active Runner: Workspace GCC (C)");
                    cmd.add("sh");
                    cmd.add("-c");
                    cmd.add("gcc " + safePath + " -o /tmp/out && /tmp/out");
                } else if ("cpp".equalsIgnoreCase(detectedLanguage)) {
                    sink.onOutput("[parallax] Active Runner: Workspace G++ (C++)");
                    cmd.add("sh");
                    cmd.add("-c");
                    cmd.add("g++ " + safePath + " -o /tmp/out && /tmp/out");
                } else {
                    sink.onOutput("[parallax] Active Runner: Workspace Fallback (" + detectedLanguage + ")");
                    if (safePath.endsWith(".c")) {
                        sink.onOutput("[parallax-debug-v5] CRITICAL: .c file hit fallback! Forcing GCC.");
                        cmd.add("sh");
                        cmd.add("-c");
                        cmd.add("gcc " + safePath + " -o /tmp/out && /tmp/out");
                    } else {
                        cmd.add("python3");
                        cmd.add(safePath);
                    }
                }

                log.info("🐳 Docker command:\n{}", String.join(" ", cmd));

                Process process = new ProcessBuilder(cmd)
                        .redirectErrorStream(true)
                        .start();

                StringBuilder output = new StringBuilder();

                Thread reader = new Thread(
                        () -> streamOutput(process, output, sink),
                        "OutputReader-" + projectId.toString().substring(0, 8)
                );
                reader.start();

                boolean finished =
                        process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

                if (!finished) {
                    process.destroyForcibly();
                    reader.join();
                    appendTruncatedNotice(output);
                    return new CommandResult(-1, output + "\n[Process killed]");
                }

                reader.join();
                sink.onOutput("[parallax] Process finished (exit code: " + process.exitValue() + ")");
                return new CommandResult(process.exitValue(), output.toString());

            } catch (Exception e) {
                log.error("Execution failed", e);
                throw e;
            }

        } finally {
            executionLockService.unlock(projectId);
        }
    }

    private String detectLanguage(String filename, String fallback) {
        if (filename == null) return fallback;
        String ext = "";
        int i = filename.lastIndexOf('.');
        if (i > 0) {
            ext = filename.substring(i + 1).toLowerCase();
        }

        return switch (ext) {
            case "py" -> "python";
            case "java" -> "java";
            case "js", "mjs" -> "javascript";
            case "ts" -> "typescript";
            case "c" -> "c";
            case "cpp", "cc", "cxx" -> "cpp";
            default -> (fallback != null && !fallback.isBlank()) ? fallback : "python";
        };
    }

    private void streamOutput(
            Process process,
            StringBuilder output,
            RunOutputSink sink
    ) {
        sink.onOutput("[debug-stream-v9] Reader thread started");
        try (BufferedReader reader =
                     new BufferedReader(
                             new InputStreamReader(
                                     process.getInputStream(),
                                     StandardCharsets.UTF_8))) {

            String line;
            int count = 0;
            while ((line = reader.readLine()) != null) {
                count++;
                if (output.length() + line.length() > maxOutputBytes) {
                    appendTruncatedNotice(output);
                    break;
                }
                output.append(line).append("\n");
                sink.onOutput(line);
            }
            sink.onOutput("[debug-stream-v9] Reader thread finished. Read " + count + " lines.");
        } catch (Exception e) {
            sink.onOutput("[debug-stream-v9] ERROR: " + e.getMessage());
            log.error("Error streaming output", e);
        }
    }

    private void appendTruncatedNotice(StringBuilder sb) {
        if (!sb.toString().contains("[Output truncated]")) {
            sb.append("\n[Output truncated]\n");
        }
    }
}

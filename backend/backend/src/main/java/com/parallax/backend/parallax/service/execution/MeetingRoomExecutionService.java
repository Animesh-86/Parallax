package com.parallax.backend.parallax.service.execution;

import com.parallax.backend.parallax.dto.execution.MeetingRoomRunCodeRequest;
import com.parallax.backend.parallax.dto.execution.RunCodeBroadcastMessage;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MeetingRoomExecutionService {

    private static final Logger log = LoggerFactory.getLogger(MeetingRoomExecutionService.class);
    private final SimpMessagingTemplate messagingTemplate;
    
    private final com.parallax.backend.parallax.service.room.MeetingRoomService meetingRoomService;

    // We limit Meeting Room runs to prevent abuse (DDoS or server crashing)
    private static final int TIMEOUT_SECONDS = 5;
    private static final int MAX_OUTPUT_BYTES = 65536; // 64 KB limit

    public void runCodeInRoom(UUID roomId, MeetingRoomRunCodeRequest request, UUID userId) {
        meetingRoomService.requireRoomMember(roomId, userId);
        
        String code = request.getCode();
        String language = request.getLanguage().toLowerCase();

        // Broadcast RUN_STARTED
        send(roomId, new RunCodeBroadcastMessage(
                roomId.toString(),
                "RUN_STARTED",
                null,
                null,
                userId.toString()
        ));

        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");                   // Auto-cleanup
        cmd.add("-i");                     // Interactive (read from stdin)
        cmd.add("--network=none");         // No network access (air-gapped)
        cmd.add("--memory=256m");          // Memory limit
        cmd.add("--memory-swap=256m");     // No swap abuse
        cmd.add("--cpus=1.0");             // CPU limit
        cmd.add("--pids-limit=128");       // Fork bomb protection
        cmd.add("--read-only");            // Immutable root filesystem
        cmd.add("--tmpfs=/tmp:rw,noexec,nosuid,size=50m"); // Writable temp
        cmd.add("--security-opt=no-new-privileges:true");  // No SUID escalation
        cmd.add("--cap-drop=ALL");         // Drop all Linux capabilities
        cmd.add("--user=1000:1000");       // Non-root user
        cmd.add("--ulimit=nofile=512:1024"); // File descriptor limit
        cmd.add("--ipc=none");             // No shared memory

        try {
            if ("python".equals(language)) {
                cmd.add("parallax-python-runner");
                cmd.add("python3");
                cmd.add("-c");
                cmd.add(code);
            } else if ("javascript".equals(language) || "typescript".equals(language)) {
                cmd.add("parallax-js-runner");
                cmd.add("node");
                cmd.add("-e");
                cmd.add(code);
            } else if ("java".equals(language)) {
                // For Java we pipe into a shell script that writes the file, compiles, and runs it
                cmd.add("parallax-java-runner");
                cmd.add("sh");
                cmd.add("-c");
                cmd.add("cat > Main.java && javac Main.java && java Main");
            } else if ("cpp".equals(language) || "c".equals(language)) {
                cmd.add("parallax-cpp-runner");
                cmd.add("sh");
                cmd.add("-c");
                cmd.add("cat > main.cpp && g++ main.cpp -o main && ./main");
            } else {
                throw new IllegalArgumentException("Unsupported language: " + language);
            }

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // If Java or C++, we must write code to stdin
            if ("java".equals(language) || "cpp".equals(language) || "c".equals(language)) {
                try (java.io.OutputStream os = process.getOutputStream()) {
                    os.write(code.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }
            }

            StringBuilder output = new StringBuilder();

            Thread reader = new Thread(() -> {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    int count = 0;
                    while ((line = br.readLine()) != null) {
                        count++;
                        if (output.length() + line.length() > MAX_OUTPUT_BYTES) {
                            if (!output.toString().contains("[Output truncated]")) {
                                output.append("\n[Output truncated]");
                                send(roomId, new RunCodeBroadcastMessage(roomId.toString(), "RUN_OUTPUT", "[Output truncated]", null, userId.toString()));
                            }
                            break;
                        }
                        output.append(line).append("\n");
                        send(roomId, new RunCodeBroadcastMessage(roomId.toString(), "RUN_OUTPUT", line, null, userId.toString()));
                    }
                } catch (Exception e) {
                    log.error("Error reading process stream", e);
                }
            });
            reader.start();

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                reader.join();
                send(roomId, new RunCodeBroadcastMessage(roomId.toString(), "RUN_OUTPUT", "\n[Process killed: Timeout Exceeded]", null, userId.toString()));
                send(roomId, new RunCodeBroadcastMessage(roomId.toString(), "RUN_FINISHED", null, -1, userId.toString()));
                return;
            }

            reader.join();
            send(roomId, new RunCodeBroadcastMessage(roomId.toString(), "RUN_FINISHED", null, process.exitValue(), userId.toString()));

        } catch (Exception ex) {
            log.error("Error executing meeting room code", ex);
            send(roomId, new RunCodeBroadcastMessage(
                    roomId.toString(),
                    "RUN_ERROR",
                    "Execution failed: " + ex.getMessage(),
                    -1,
                    userId.toString()
            ));
        }
    }

    private void send(UUID roomId, RunCodeBroadcastMessage payload) {
        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/run-output",
                payload
        );
    }
}

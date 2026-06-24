package com.parallax.backend.parallax.controller.team;

import com.parallax.backend.parallax.entity.team.TeamTask;
import com.parallax.backend.parallax.repository.team.TeamTaskRepository;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.team.TeamPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams/{teamId}/tasks")
@RequiredArgsConstructor
public class TeamTaskController {

    private final TeamTaskRepository taskRepository;
    private final TeamPermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<TeamTask>> listTasks(
            @PathVariable UUID teamId,
            Authentication auth) {
        permissionService.verifyMember(teamId, AuthUtil.requireUserId(auth));
        return ResponseEntity.ok(taskRepository.findByTeamIdOrderByCreatedAtAsc(teamId));
    }

    @PostMapping
    public ResponseEntity<TeamTask> createTask(
            @PathVariable UUID teamId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);

        String title = (String) body.getOrDefault("title", "");
        if (title == null || title.trim().isEmpty()) return ResponseEntity.badRequest().build();

        TeamTask task = new TeamTask();
        task.setTeamId(teamId);
        task.setTitle(title.trim());
        task.setDescription((String) body.get("description"));
        task.setStatus(TeamTask.TaskStatus.TODO);
        task.setCreatedById(userId);
        task.setCreatedByName((String) body.getOrDefault("createdByName", "Unknown"));

        String assigneeIdStr = (String) body.get("assigneeId");
        if (assigneeIdStr != null && !assigneeIdStr.isBlank()) {
            task.setAssigneeId(UUID.fromString(assigneeIdStr));
            task.setAssigneeName((String) body.get("assigneeName"));
        }

        return ResponseEntity.ok(taskRepository.save(task));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<TeamTask> updateTask(
            @PathVariable UUID teamId,
            @PathVariable UUID taskId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        permissionService.verifyMember(teamId, AuthUtil.requireUserId(auth));
        TeamTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !task.getTeamId().equals(teamId)) return ResponseEntity.notFound().build();

        if (body.containsKey("title") && body.get("title") != null) {
            task.setTitle(((String) body.get("title")).trim());
        }
        if (body.containsKey("description")) {
            task.setDescription((String) body.get("description"));
        }
        if (body.containsKey("status")) {
            task.setStatus(TeamTask.TaskStatus.valueOf((String) body.get("status")));
        }
        if (body.containsKey("assigneeId")) {
            String assigneeIdStr = (String) body.get("assigneeId");
            if (assigneeIdStr == null || assigneeIdStr.isBlank()) {
                task.setAssigneeId(null);
                task.setAssigneeName(null);
            } else {
                    task.setAssigneeId(UUID.fromString(assigneeIdStr));
                    task.setAssigneeName((String) body.get("assigneeName"));
            }
        }

        return ResponseEntity.ok(taskRepository.save(task));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID teamId,
            @PathVariable UUID taskId,
            Authentication auth) {
        permissionService.verifyMember(teamId, AuthUtil.requireUserId(auth));
        TeamTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !task.getTeamId().equals(teamId)) return ResponseEntity.notFound().build();
        taskRepository.delete(task);
        return ResponseEntity.noContent().build();
    }
}

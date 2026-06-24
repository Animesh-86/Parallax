package com.parallax.backend.parallax.controller.team;

import com.parallax.backend.parallax.entity.team.TeamNote;
import com.parallax.backend.parallax.entity.team.TeamNote.NoteVisibility;
import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.repository.team.TeamNoteRepository;
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
@RequestMapping("/api/teams/{teamId}/notes")
@RequiredArgsConstructor
public class TeamNoteController {

    private final TeamNoteRepository noteRepository;
    private final TeamPermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<TeamNote>> listNotes(
            @PathVariable UUID teamId,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        TeamMemberRole role = permissionService.getMemberRole(teamId, userId);
        boolean isAdmin = (role == TeamMemberRole.ADMIN || role == TeamMemberRole.OWNER);

        List<TeamNote> allNotes = noteRepository.findByTeamIdOrderByUpdatedAtDesc(teamId);
        List<TeamNote> visibleNotes = allNotes.stream().filter(note -> {
            if (note.getVisibility() == NoteVisibility.PRIVATE) {
                return userId.equals(note.getCreatedById());
            }
            if (note.getVisibility() == NoteVisibility.ADMIN_ONLY) {
                return isAdmin || userId.equals(note.getCreatedById());
            }
            return true;
        }).toList();

        return ResponseEntity.ok(visibleNotes);
    }

    @PostMapping
    public ResponseEntity<TeamNote> createNote(
            @PathVariable UUID teamId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        String title = body.getOrDefault("title", "Untitled").trim();
        if (title.isEmpty()) title = "Untitled";

        TeamNote note = new TeamNote();
        note.setTeamId(teamId);
        note.setTitle(title);
        note.setContent(body.getOrDefault("content", ""));
        note.setCreatedById(userId);
        note.setCreatedByName(body.getOrDefault("createdByName", "Unknown"));
        note.setLastEditedBy(note.getCreatedByName());
        
            if (body.containsKey("visibility")) {
                note.setVisibility(NoteVisibility.valueOf(body.get("visibility")));
            }

        return ResponseEntity.ok(noteRepository.save(note));
    }

    @PutMapping("/{noteId}")
    public ResponseEntity<TeamNote> updateNote(
            @PathVariable UUID teamId,
            @PathVariable UUID noteId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        TeamMemberRole role = permissionService.getMemberRole(teamId, userId);
        boolean isAdmin = (role == TeamMemberRole.ADMIN || role == TeamMemberRole.OWNER);

        TeamNote note = noteRepository.findById(noteId).orElse(null);
        if (note == null || !note.getTeamId().equals(teamId)) return ResponseEntity.notFound().build();

        if (note.getVisibility() == NoteVisibility.PRIVATE && !userId.equals(note.getCreatedById())) {
            return ResponseEntity.status(403).build();
        }
        if (note.getVisibility() == NoteVisibility.ADMIN_ONLY && !isAdmin && !userId.equals(note.getCreatedById())) {
            return ResponseEntity.status(403).build();
        }

        if (body.containsKey("title") && !body.get("title").isBlank()) {
            note.setTitle(body.get("title").trim());
        }
        if (body.containsKey("content")) {
            note.setContent(body.get("content"));
        }
        if (body.containsKey("visibility")) {
            note.setVisibility(NoteVisibility.valueOf(body.get("visibility")));
        }

        note.setLastEditedBy(body.getOrDefault("editedByName", "Unknown"));
        return ResponseEntity.ok(noteRepository.save(note));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID teamId,
            @PathVariable UUID noteId,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        TeamMemberRole role = permissionService.getMemberRole(teamId, userId);
        boolean isAdmin = (role == TeamMemberRole.ADMIN || role == TeamMemberRole.OWNER);

        TeamNote note = noteRepository.findById(noteId).orElse(null);
        if (note == null || !note.getTeamId().equals(teamId)) return ResponseEntity.notFound().build();

        if (note.getVisibility() == NoteVisibility.PRIVATE && !userId.equals(note.getCreatedById())) {
            return ResponseEntity.status(403).build();
        }
        if (note.getVisibility() == NoteVisibility.ADMIN_ONLY && !isAdmin && !userId.equals(note.getCreatedById())) {
            return ResponseEntity.status(403).build();
        }

        noteRepository.delete(note);
        return ResponseEntity.noContent().build();
    }
}

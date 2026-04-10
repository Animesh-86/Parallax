package com.parallax.backend.parallax.controller.team;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parallax.backend.parallax.dto.team.CreateTeamRequest;
import com.parallax.backend.parallax.dto.team.InviteTeamMemberRequest;
import com.parallax.backend.parallax.dto.team.TeamMemberResponse;
import com.parallax.backend.parallax.dto.team.TeamResponse;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.team.TeamService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody CreateTeamRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        TeamResponse response = teamService.createTeam(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getMyTeams(Authentication authentication) {
        UUID userId = AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(teamService.getMyTeams(userId));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<TeamResponse> getTeam(
            @PathVariable UUID teamId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(teamService.getTeam(teamId, userId));
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberResponse>> getMembers(
            @PathVariable UUID teamId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(teamService.getTeamMembers(teamId, userId));
    }

    @PostMapping("/{teamId}/members/invite")
    public ResponseEntity<TeamMemberResponse> inviteMember(
            @PathVariable UUID teamId,
            @Valid @RequestBody InviteTeamMemberRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        TeamMemberResponse response = teamService.inviteMember(teamId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{teamId}/members/accept")
    public ResponseEntity<Void> acceptInvite(
            @PathVariable UUID teamId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        teamService.acceptInvite(teamId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{teamId}/members/reject")
    public ResponseEntity<Void> rejectInvite(
            @PathVariable UUID teamId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        teamService.rejectInvite(teamId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID teamId,
            @PathVariable UUID memberId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        teamService.removeMember(teamId, userId, memberId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{teamId}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable UUID teamId,
            @RequestBody CreateTeamRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        return ResponseEntity.ok(teamService.updateTeam(teamId, userId, request));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable UUID teamId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        teamService.deleteTeam(teamId, userId);
        return ResponseEntity.ok().build();
    }
}

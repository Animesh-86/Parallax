package com.parallax.backend.parallax.controller.team;

import com.parallax.backend.parallax.entity.team.TeamChannel;
import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.repository.team.TeamChannelRepository;
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
@RequestMapping("/api/teams/{teamId}/channels")
@RequiredArgsConstructor
public class TeamChannelController {

    private final TeamChannelRepository channelRepository;
    private final TeamPermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<TeamChannel>> listChannels(
            @PathVariable UUID teamId,
            Authentication auth) {
        permissionService.verifyMember(teamId, AuthUtil.requireUserId(auth));
        return ResponseEntity.ok(channelRepository.findByTeamIdOrderByCreatedAtAsc(teamId));
    }

    @PostMapping
    public ResponseEntity<TeamChannel> createChannel(
            @PathVariable UUID teamId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        TeamMemberRole role = permissionService.getMemberRole(teamId, userId);
        if (role != TeamMemberRole.ADMIN && role != TeamMemberRole.OWNER) {
            return ResponseEntity.status(403).build();
        }

        String name = body.getOrDefault("name", "").trim().toLowerCase().replaceAll("\\s+", "-");
        if (name.isEmpty()) return ResponseEntity.badRequest().build();
        if (channelRepository.existsByTeamIdAndName(teamId, name)) {
            return ResponseEntity.badRequest().build();
        }

        String typeStr = body.getOrDefault("type", "TEXT").toUpperCase();
        TeamChannel.ChannelType type;
        try {
            type = TeamChannel.ChannelType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            type = TeamChannel.ChannelType.TEXT;
        }

        TeamChannel channel = new TeamChannel();
        channel.setTeamId(teamId);
        channel.setName(name);
        channel.setType(type);
        return ResponseEntity.ok(channelRepository.save(channel));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable UUID teamId,
            @PathVariable UUID channelId,
            Authentication auth) {
        UUID userId = AuthUtil.requireUserId(auth);
        permissionService.verifyMember(teamId, userId);
        TeamMemberRole role = permissionService.getMemberRole(teamId, userId);
        if (role != TeamMemberRole.ADMIN && role != TeamMemberRole.OWNER) {
            return ResponseEntity.status(403).build();
        }
        TeamChannel channel = channelRepository.findById(channelId)
                .orElse(null);
        if (channel == null || !channel.getTeamId().equals(teamId)) {
            return ResponseEntity.notFound().build();
        }
        if (channel.isDefault()) {
            return ResponseEntity.badRequest().build(); // cannot delete defaults
        }
        channelRepository.delete(channel);
        return ResponseEntity.noContent().build();
    }
}

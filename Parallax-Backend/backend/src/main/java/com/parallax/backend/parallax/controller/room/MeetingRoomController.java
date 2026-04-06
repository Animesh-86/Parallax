package com.parallax.backend.parallax.controller.room;

import com.parallax.backend.parallax.dto.collaborator.InviteNotification;
import com.parallax.backend.parallax.dto.room.CreateRoomRequest;
import com.parallax.backend.parallax.dto.room.RoomInviteRequest;
import com.parallax.backend.parallax.dto.room.RoomResponse;
import com.parallax.backend.parallax.dto.room.RoomSettingsUpdateRequest;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.room.MeetingRoom;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.room.MeetingRoomService;
import com.parallax.backend.parallax.websocket.publisher.InviteWebSocketPublisher;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;
    private final UserRepository userRepository;
    private final InviteWebSocketPublisher inviteWsPublisher;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        RoomResponse response = meetingRoomService.createRoom(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getActiveRooms(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
        UUID userId = AuthUtil.requireUserId(authentication);
        List<RoomResponse> rooms = meetingRoomService.getActiveRoomsForUser(userId);
        return ResponseEntity.ok(rooms);
    }

    @PostMapping("/join/{roomCode}")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        RoomResponse response = meetingRoomService.joinRoomByCode(roomCode, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomById(
            @PathVariable UUID roomId,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        RoomResponse response = meetingRoomService.getRoomByIdForUser(roomId, userId);
        return ResponseEntity.ok(response);
    }

        @DeleteMapping("/{roomId}")
        public ResponseEntity<Void> deleteRoom(
                        @PathVariable UUID roomId,
                        Authentication authentication
        ) {
                UUID userId = AuthUtil.requireUserId(authentication);
                meetingRoomService.deleteRoom(roomId, userId);
                return ResponseEntity.noContent().build();
        }

    @PatchMapping("/{roomId}/settings")
    public ResponseEntity<RoomResponse> updateRoomSettings(
            @PathVariable UUID roomId,
            @RequestBody RoomSettingsUpdateRequest request,
            Authentication authentication
    ) {
        UUID userId = AuthUtil.requireUserId(authentication);
        RoomResponse response = meetingRoomService.updateRoomSettings(roomId, userId, request);
        return ResponseEntity.ok(response);
    }

    // Compatibility route for clients/environments that cannot issue PATCH
    @PutMapping("/{roomId}/settings")
    public ResponseEntity<RoomResponse> updateRoomSettingsPut(
            @PathVariable UUID roomId,
            @RequestBody RoomSettingsUpdateRequest request,
            Authentication authentication
    ) {
        return updateRoomSettings(roomId, request, authentication);
    }

    // Compatibility route for clients/environments that cannot issue PATCH/PUT
    @PostMapping("/{roomId}/settings")
    public ResponseEntity<RoomResponse> updateRoomSettingsPost(
            @PathVariable UUID roomId,
            @RequestBody RoomSettingsUpdateRequest request,
            Authentication authentication
    ) {
        return updateRoomSettings(roomId, request, authentication);
    }

        @PatchMapping("/by-code/{roomCode}/settings")
        public ResponseEntity<RoomResponse> updateRoomSettingsByCode(
                        @PathVariable String roomCode,
                        @RequestBody RoomSettingsUpdateRequest request,
                        Authentication authentication
        ) {
                UUID userId = AuthUtil.requireUserId(authentication);
                RoomResponse response = meetingRoomService.updateRoomSettingsByCode(roomCode, userId, request);
                return ResponseEntity.ok(response);
        }

        @PutMapping("/by-code/{roomCode}/settings")
        public ResponseEntity<RoomResponse> updateRoomSettingsByCodePut(
                        @PathVariable String roomCode,
                        @RequestBody RoomSettingsUpdateRequest request,
                        Authentication authentication
        ) {
                return updateRoomSettingsByCode(roomCode, request, authentication);
        }

        @PostMapping("/by-code/{roomCode}/settings")
        public ResponseEntity<RoomResponse> updateRoomSettingsByCodePost(
                        @PathVariable String roomCode,
                        @RequestBody RoomSettingsUpdateRequest request,
                        Authentication authentication
        ) {
                return updateRoomSettingsByCode(roomCode, request, authentication);
        }

    // INVITE USER TO ROOM BY EMAIL
    @PostMapping("/{roomId}/invite")
    public ResponseEntity<?> inviteToRoom(
            @PathVariable UUID roomId,
            @Valid @RequestBody RoomInviteRequest request,
            Authentication authentication
    ) {
        UUID requesterId = AuthUtil.requireUserId(authentication);
        meetingRoomService.requireRoomOwner(roomId, requesterId);

        // Find the room
        MeetingRoom room = meetingRoomService.findRoom(roomId);

        // Find the invitee by email
        User invitee = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (invitee == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with email: " + request.getEmail()));
        }

        if (invitee.getId().equals(requesterId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "You cannot invite yourself"));
        }

        meetingRoomService.addParticipantIfMissing(roomId, invitee.getId());

        // Find inviter email for the notification
        String inviterEmail = userRepository.findById(requesterId)
                .map(User::getEmail)
                .orElse("unknown");

        // Send real-time WebSocket notification to the invitee
        inviteWsPublisher.notifyUser(
                invitee.getId(),
                new InviteNotification(
                        "ROOM_INVITE",
                        room.getId(),
                        room.getId(),
                        room.getName() + " (Room: " + room.getRoomCode() + ")",
                        inviterEmail
                )
        );

        return ResponseEntity.ok(Map.of(
                "message", "Invitation sent to " + request.getEmail(),
                "inviteeName", invitee.getEmail()
        ));
    }
}

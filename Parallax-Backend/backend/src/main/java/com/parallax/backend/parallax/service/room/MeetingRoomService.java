package com.parallax.backend.parallax.service.room;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parallax.backend.parallax.dto.room.CreateRoomRequest;
import com.parallax.backend.parallax.dto.room.RoomResponse;
import com.parallax.backend.parallax.dto.room.RoomSettingsUpdateRequest;
import com.parallax.backend.parallax.entity.room.MeetingRoom;
import com.parallax.backend.parallax.entity.room.RoomParticipant;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.room.MeetingRoomRepository;
import com.parallax.backend.parallax.repository.room.RoomParticipantRepository;

@Service
public class MeetingRoomService {

    private final MeetingRoomRepository meetingRoomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 10;
    private static final Set<String> MODES = Set.of("INTERVIEW", "TEAM");
    private static final Set<String> VISIBILITY = Set.of("PRIVATE", "PUBLIC");
    private static final Set<String> WHITEBOARD_EDIT_POLICY = Set.of("HOST_ONLY", "EVERYONE");
    private final SecureRandom random = new SecureRandom();

    public MeetingRoomService(MeetingRoomRepository meetingRoomRepository, RoomParticipantRepository roomParticipantRepository) {
        this.meetingRoomRepository = meetingRoomRepository;
        this.roomParticipantRepository = roomParticipantRepository;
    }

    private String generateRoomCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            if (i > 0 && i % 4 == 0) {
                code.append("-");
            }
            code.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return code.toString();
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, UUID userId) {
        String code = generateRoomCode();
        while (meetingRoomRepository.findByRoomCode(code).isPresent()) {
            code = generateRoomCode();
        }

        MeetingRoom room = new MeetingRoom(request.getName(), userId, code);

        String requestedMode = request.getCollaborationMode();
        if (requestedMode != null && !requestedMode.isBlank()) {
            room.setCollaborationMode(normalizeChoice(requestedMode, MODES, "collaborationMode"));
        }
        if ("INTERVIEW".equals(room.getCollaborationMode())) {
            applyInterviewModeDefaults(room);
        }

        meetingRoomRepository.save(room);

        RoomParticipant participant = new RoomParticipant(room.getId(), userId);
        roomParticipantRepository.save(participant);

        return mapToResponse(room);
    }

    @Transactional
    public RoomResponse joinRoomByCode(String roomCode, UUID userId) {
        MeetingRoom room = meetingRoomRepository.findByRoomCode(roomCode.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.isActive()) {
            throw new IllegalStateException("Room is no longer active");
        }

        boolean alreadyMember = roomParticipantRepository.existsByRoomIdAndUserId(room.getId(), userId);
        if (!room.isCodeOpen() && !alreadyMember && !room.getCreatedBy().equals(userId)) {
            throw new SecurityException("This room is invite-only. Ask the host for access.");
        }

        if (!alreadyMember) {
            RoomParticipant participant = new RoomParticipant(room.getId(), userId);
            roomParticipantRepository.save(participant);
        }

        return mapToResponse(room);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomByIdForUser(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        requireRoomMember(roomId, userId);
        return mapToResponse(room);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getActiveRoomsForUser(UUID userId) {
        List<MeetingRoom> createdRooms = meetingRoomRepository.findByCreatedByAndIsActiveTrue(userId);
        List<UUID> joinedRoomIds = roomParticipantRepository.findByUserId(userId)
                .stream()
                .map(RoomParticipant::getRoomId)
                .collect(Collectors.toList());

        List<MeetingRoom> joinedRooms = joinedRoomIds.isEmpty()
                ? List.of()
                : meetingRoomRepository.findByIdInAndIsActiveTrue(joinedRoomIds);

        LinkedHashMap<UUID, MeetingRoom> merged = new LinkedHashMap<>();
        createdRooms.forEach(room -> merged.put(room.getId(), room));
        joinedRooms.forEach(room -> merged.put(room.getId(), room));

        return merged.values().stream()
                .sorted(Comparator.comparing(MeetingRoom::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MeetingRoom findRoom(UUID roomId) {
        return meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    @Transactional(readOnly = true)
    public MeetingRoom findActiveRoomByCode(String roomCode) {
        MeetingRoom room = meetingRoomRepository.findByRoomCode(roomCode.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.isActive()) {
            throw new IllegalStateException("Room is no longer active");
        }

        return room;
    }

    @Transactional(readOnly = true)
    public void requireRoomMember(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        boolean isOwner = room.getCreatedBy().equals(userId);
        boolean isParticipant = roomParticipantRepository.existsByRoomIdAndUserId(roomId, userId);
        if (!isOwner && !isParticipant) {
            throw new SecurityException("You are not a member of this room");
        }
    }

    @Transactional(readOnly = true)
    public void requireRoomOwner(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.getCreatedBy().equals(userId)) {
            throw new SecurityException("Only room host can perform this action");
        }
    }

    @Transactional(readOnly = true)
    public boolean isWhiteboardEnabled(UUID roomId) {
        return findRoom(roomId).isWhiteboardEnabled();
    }

    @Transactional(readOnly = true)
    public boolean isWhiteboardVisibleToUser(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        if (room.getCreatedBy().equals(userId)) {
            return true;
        }
        return "PUBLIC".equals(room.getWhiteboardVisibility());
    }

    @Transactional(readOnly = true)
    public boolean canEditWhiteboard(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        if (!isWhiteboardVisibleToUser(roomId, userId)) {
            return false;
        }
        if (room.getCreatedBy().equals(userId)) {
            return true;
        }
        return "EVERYONE".equals(room.getWhiteboardEditPolicy());
    }

    @Transactional
    public void addParticipantIfMissing(UUID roomId, UUID userId) {
        if (!roomParticipantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            roomParticipantRepository.save(new RoomParticipant(roomId, userId));
        }
    }

    @Transactional
    public void removeParticipant(UUID roomId, UUID userId) {
        MeetingRoom room = findRoom(roomId);
        if (room.getCreatedBy().equals(userId)) {
            throw new IllegalStateException("Host cannot be removed from room");
        }

        List<RoomParticipant> participants = roomParticipantRepository.findByRoomId(roomId);
        participants.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .ifPresent(roomParticipantRepository::delete);
    }

    @Transactional
    public RoomResponse updateRoomSettings(UUID roomId, UUID userId, RoomSettingsUpdateRequest request) {
        requireRoomOwner(roomId, userId);
        MeetingRoom room = findRoom(roomId);

        if (request.getCollaborationMode() != null) {
            room.setCollaborationMode(normalizeChoice(request.getCollaborationMode(), MODES, "collaborationMode"));
        }
        if (request.getCodeOpen() != null) {
            room.setCodeOpen(request.getCodeOpen());
        }
        if (request.getWhiteboardEnabled() != null) {
            room.setWhiteboardEnabled(request.getWhiteboardEnabled());
        }
        if (request.getWhiteboardVisibility() != null) {
            room.setWhiteboardVisibility(normalizeChoice(request.getWhiteboardVisibility(), VISIBILITY, "whiteboardVisibility"));
        }
        if (request.getWhiteboardEditPolicy() != null) {
            room.setWhiteboardEditPolicy(normalizeChoice(request.getWhiteboardEditPolicy(), WHITEBOARD_EDIT_POLICY, "whiteboardEditPolicy"));
        }
        if (request.getCodeVisibility() != null) {
            room.setCodeVisibility(normalizeChoice(request.getCodeVisibility(), VISIBILITY, "codeVisibility"));
        }
        if (request.getTaskVisibility() != null) {
            room.setTaskVisibility(normalizeChoice(request.getTaskVisibility(), VISIBILITY, "taskVisibility"));
        }

        // Interview mode is intentionally restrictive.
        if ("INTERVIEW".equals(room.getCollaborationMode())) {
            applyInterviewModeDefaults(room);
        }

        meetingRoomRepository.save(room);
        return mapToResponse(room);
    }

    @Transactional
    public RoomResponse updateRoomSettingsByCode(String roomCode, UUID userId, RoomSettingsUpdateRequest request) {
        MeetingRoom room = findActiveRoomByCode(roomCode);
        return updateRoomSettings(room.getId(), userId, request);
    }

    @Transactional
    public void deleteRoom(UUID roomId, UUID userId) {
        requireRoomOwner(roomId, userId);
        roomParticipantRepository.deleteByRoomId(roomId);
        meetingRoomRepository.deleteById(roomId);
    }

    private RoomResponse mapToResponse(MeetingRoom room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCreatedBy(),
                room.getCreatedAt(),
                room.getRoomCode(),
                room.isActive(),
                room.isCodeOpen(),
                room.isWhiteboardEnabled(),
                room.getCollaborationMode(),
                room.getWhiteboardVisibility(),
                room.getWhiteboardEditPolicy(),
                room.getCodeVisibility(),
                room.getTaskVisibility(),
                room.isChatDisabled(),
                room.isScreenShareDisabled()
        );
    }

    private String normalizeChoice(String value, Set<String> allowed, String fieldName) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Invalid " + fieldName + ". Allowed values: " + Arrays.toString(allowed.toArray())
            );
        }
        return normalized;
    }

    private void applyInterviewModeDefaults(MeetingRoom room) {
        room.setCodeOpen(false);
        room.setWhiteboardEnabled(true);
        room.setWhiteboardVisibility("PUBLIC");
        room.setWhiteboardEditPolicy("HOST_ONLY");
        room.setCodeVisibility("PUBLIC");
        room.setTaskVisibility("PUBLIC");
        room.setChatDisabled(true);
        room.setScreenShareDisabled(true);
    }
}

package com.parallax.backend.parallax.room;

import com.parallax.backend.parallax.controller.room.RoomWebSocketController;
import com.parallax.backend.parallax.dto.room.RoomResponse;
import com.parallax.backend.parallax.entity.room.MeetingRoom;
import com.parallax.backend.parallax.entity.room.RoomParticipant;
import com.parallax.backend.parallax.repository.room.MeetingRoomRepository;
import com.parallax.backend.parallax.repository.room.RoomParticipantRepository;
import com.parallax.backend.parallax.service.room.MeetingRoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class RoomSecurityIntegrationTests {

    @Autowired
    private MeetingRoomRepository meetingRoomRepository;

    @Autowired
    private RoomParticipantRepository roomParticipantRepository;

    @Autowired
    private MeetingRoomService meetingRoomService;

    @Autowired
    private RoomWebSocketController roomWebSocketController;

    @Test
    void inviteOnlyJoinRejectsNonMember() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID outsiderId = UUID.randomUUID();

        MeetingRoom room = new MeetingRoom("Invite Only", ownerId, "INV123");
        room.setCodeOpen(false);
        meetingRoomRepository.save(room);

        assertThrows(SecurityException.class,
            () -> meetingRoomService.joinRoomByCode("INV123", outsiderId));
    }

    @Test
        void openJoinAllowsNonInvitedUser() {
        UUID ownerId = UUID.randomUUID();
        UUID joinerId = UUID.randomUUID();

        MeetingRoom room = new MeetingRoom("Open Room", ownerId, "OPEN12");
        room.setCodeOpen(true);
        meetingRoomRepository.save(room);

        RoomResponse response = meetingRoomService.joinRoomByCode("OPEN12", joinerId);

        assertEquals("OPEN12", response.getRoomCode());
        assertTrue(roomParticipantRepository.existsByRoomIdAndUserId(room.getId(), joinerId));
    }

    @Test
    void whiteboardDisabledRejectsPublishWithSecurityError() {
        UUID ownerId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        MeetingRoom room = new MeetingRoom("No Whiteboard", ownerId, "WBLOCK");
        room.setCodeOpen(true);
        room.setWhiteboardEnabled(false);
        meetingRoomRepository.save(room);

        roomParticipantRepository.save(new RoomParticipant(room.getId(), memberId));

        Principal principal = () -> memberId.toString();

        assertThrows(SecurityException.class, () ->
                roomWebSocketController.handleWhiteboardSync(Map.of("event", "draw"), room.getId(), principal));
    }
}

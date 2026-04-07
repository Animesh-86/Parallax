package com.parallax.backend.parallax.controller.room;

import com.parallax.backend.parallax.dto.room.RoomSignalMessage;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.room.MeetingRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final MeetingRoomService roomService; // If we need validation later
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{roomId}/call")
    public void handleWebRTCSignal(
            RoomSignalMessage msg,
            @DestinationVariable UUID roomId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);
        roomService.requireRoomMember(roomId, userId);
        
        // Ensure sender matches the logged-in user
        msg.setSenderId(userId);

        if ("CALL_SCREEN_SHARE".equals(msg.getType()) && !roomService.canShareScreen(roomId)) {
            throw new SecurityException("Screen sharing is disabled in this room");
        }

        if ("CALL_JOIN".equals(msg.getType()) || "CALL_LEAVE".equals(msg.getType())) {
            // Broadcast to everyone in the room
            messagingTemplate.convertAndSend(
                    "/topic/rooms/" + roomId + "/call",
                    msg
            );
        } else if ("CALL_OFFER".equals(msg.getType()) || 
                   "CALL_ANSWER".equals(msg.getType()) || 
                   "CALL_ICE".equals(msg.getType())) {
                   
            if (msg.getTargetId() != null) {
                // Direct message to specific peer for SDP negotiation
                messagingTemplate.convertAndSendToUser(
                        msg.getTargetId().toString(),
                        "/queue/rooms/call",
                        msg
                );
            }
        }
    }
    
    @MessageMapping("/rooms/{roomId}/whiteboard")
    public void handleWhiteboardSync(
            Map<String, Object> payload,
            @DestinationVariable UUID roomId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);
        roomService.requireRoomMember(roomId, userId);
        if (!roomService.isWhiteboardEnabled(roomId)) {
            throw new SecurityException("Whiteboard is disabled for this room");
        }
        if (!roomService.isWhiteboardVisibleToUser(roomId, userId)) {
            throw new SecurityException("Whiteboard is private in this room");
        }
        if (!roomService.canEditWhiteboard(roomId, userId)) {
            throw new SecurityException("Only host can edit whiteboard in this room");
        }

        // Simple stateless JSON relay for Tldraw or standard whiteboard syncing
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/whiteboard", (Object) payload);
    }

    @MessageMapping("/rooms/{roomId}/chat")
    public void handleChat(
            Map<String, Object> payload,
            @DestinationVariable UUID roomId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);
        roomService.requireRoomMember(roomId, userId);

        if (Boolean.TRUE.equals(payload.get("isTaskSync")) && !roomService.canMutateTasks(roomId, userId)) {
            throw new SecurityException("Only host can update tasks in this room mode");
        }
        if (Boolean.TRUE.equals(payload.get("isCodeSync")) && !roomService.canEditCode(roomId, userId)) {
            throw new SecurityException("You do not have code edit permission");
        }
        if (!Boolean.TRUE.equals(payload.get("isAdminAction"))
                && !Boolean.TRUE.equals(payload.get("isTaskSync"))
                && !Boolean.TRUE.equals(payload.get("isCodeSync"))
                && !Boolean.TRUE.equals(payload.get("isNotesUpdate"))
                && !Boolean.TRUE.equals(payload.get("isReaction"))
                && !Boolean.TRUE.equals(payload.get("isPresence"))
                && !Boolean.TRUE.equals(payload.get("isHandRaise"))
                && !roomService.canUseChat(roomId)) {
            throw new SecurityException("Chat is disabled in this room");
        }

        boolean isAdminAction = Boolean.TRUE.equals(payload.get("isAdminAction"));
        if (isAdminAction) {
            roomService.requireRoomOwner(roomId, userId);
            Object action = payload.get("action");
            if ("KICK".equals(action) && payload.get("targetId") instanceof String targetIdStr) {
                roomService.removeParticipant(roomId, UUID.fromString(targetIdStr));
            }
        }

        // Ephemeral chat relay — no DB persistence, just broadcast
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/chat", (Object) payload);
    }
}

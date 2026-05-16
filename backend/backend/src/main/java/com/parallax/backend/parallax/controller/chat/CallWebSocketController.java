package com.parallax.backend.parallax.controller.chat;

import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.chat.CallService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Controller
public class CallWebSocketController {

    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    public CallWebSocketController(CallService callService, SimpMessagingTemplate messagingTemplate) {
        this.callService = callService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/direct/{channelId}/call")
    public void handleDirect(
            Map<String, Object> msg,
            @DestinationVariable String channelId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);
        Map<String, Object> normalized = new HashMap<>(msg);
        normalized.put("senderId", userId.toString());
        normalized.put("channelId", channelId);

        messagingTemplate.convertAndSend("/topic/direct/" + channelId + "/call", (Object) normalized);
    }

    @MessageMapping("/project/{projectId}/call")
    public void handle(
            Map<String, Object> msg,
            @DestinationVariable UUID projectId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);

        String type = String.valueOf(msg.get("type"));
        Map<String, Object> normalized = new HashMap<>(msg);
        normalized.put("senderId", userId.toString());
        normalized.put("projectId", projectId.toString());

        switch (type) {

            case "CALL_JOIN" -> {
                callService.joinCall(projectId, userId);
                messagingTemplate.convertAndSend(
                        "/topic/project/" + projectId + "/call",
                    (Object) normalized
                );
            }

            case "CALL_LEAVE" -> {
                callService.leaveCall(projectId, userId);
                messagingTemplate.convertAndSend(
                        "/topic/project/" + projectId + "/call",
                    (Object) normalized
                );
            }

            case "CALL_OFFER", "CALL_ANSWER", "CALL_ICE" -> {
                if (!callService.isParticipant(projectId, userId)) {
                    return;
                }

                Object targetRaw = normalized.get("targetId");
                if (targetRaw == null) {
                    return;
                }

                UUID targetId;
                try {
                    targetId = UUID.fromString(String.valueOf(targetRaw));
                } catch (IllegalArgumentException e) {
                    return;
                }

                messagingTemplate.convertAndSendToUser(
                        targetId.toString(),
                        "/queue/call",
                        normalized
                );
            }

            case "CALL_PRESENCE", "CALL_SCREEN_SHARE" -> {
                if (!callService.isParticipant(projectId, userId)) {
                    return;
                }
                messagingTemplate.convertAndSend(
                        "/topic/project/" + projectId + "/call",
                    (Object) normalized
                );
            }
        }
    }
}

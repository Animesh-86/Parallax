package com.parallax.backend.parallax.controller.chat;

import com.parallax.backend.parallax.dto.chat.CallSignalMessage;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.chat.CallService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class CallWebSocketController {

    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/project/{projectId}/call")
    public void handle(
            CallSignalMessage msg,
            @DestinationVariable UUID projectId,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);

        switch (msg.getType()) {

            case CALL_JOIN -> {
                callService.joinCall(projectId, userId); // auth happens inside
                messagingTemplate.convertAndSend(
                        "/topic/project/" + projectId + "/call",
                        msg
                );
            }

            case CALL_LEAVE -> {
                callService.leaveCall(projectId, userId);
                messagingTemplate.convertAndSend(
                        "/topic/project/" + projectId + "/call",
                        msg
                );
            }

            case CALL_OFFER, CALL_ANSWER, CALL_ICE -> {
                if (!callService.isParticipant(projectId, userId)) {
                    return;
                }
                messagingTemplate.convertAndSendToUser(
                        msg.getToUserId().toString(),
                        "/queue/call",
                        msg
                );
            }
        }
    }
}
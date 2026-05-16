package com.parallax.backend.parallax.controller.execution;

import com.parallax.backend.parallax.dto.execution.CodeEditMessage;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.execution.CodeEditingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class CodeSyncController {

    private final CodeEditingService codeEditingService;

    @MessageMapping("/projects/{projectId}/edit")
    public void handleEdit(
            @DestinationVariable UUID projectId,
            CodeEditMessage msg,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);

        codeEditingService.handleEdit(projectId, msg, userId);
    }
}

package com.parallax.backend.parallax.controller.execution;

import com.parallax.backend.parallax.dto.execution.RunCodeRequestWS;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.execution.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class CodeRunController {

    private final CodeExecutionService codeExecutionService;

    @MessageMapping("/projects/{projectId}/run")
    public void handleRun(
            @DestinationVariable UUID projectId,
            RunCodeRequestWS msg,
            Principal principal
    ) {
        UUID userId = AuthUtil.requireUserId(principal);

        codeExecutionService.run(projectId, msg, userId);
    }
}

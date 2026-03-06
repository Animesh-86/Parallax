package com.parallax.backend.parallax.dto.chat;

import com.parallax.backend.parallax.entity.chat.MessageType;
import lombok.Data;

import java.util.UUID;

@Data
public class CallSignalMessage {
    private MessageType type;
    private UUID projectId;
    private UUID fromUserId;
    private UUID toUserId;
}

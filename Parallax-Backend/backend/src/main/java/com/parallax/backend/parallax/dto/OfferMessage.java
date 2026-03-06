package com.parallax.backend.parallax.dto;

import com.parallax.backend.parallax.dto.chat.CallSignalMessage;
import lombok.Data;

@Data
public class OfferMessage extends CallSignalMessage {
    private String sdp;
}

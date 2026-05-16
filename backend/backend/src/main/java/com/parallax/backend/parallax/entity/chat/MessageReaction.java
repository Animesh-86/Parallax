package com.parallax.backend.parallax.entity.chat;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "message_reactions", uniqueConstraints = {
        @UniqueConstraint(columnList = "message_id, user_id, emoji_code")
})
public class MessageReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "emoji_code", nullable = false)
    private String emojiCode;

    public MessageReaction() {}

    public MessageReaction(UUID id, UUID messageId, UUID userId, String emojiCode) {
        this.id = id;
        this.messageId = messageId;
        this.userId = userId;
        this.emojiCode = emojiCode;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMessageId() { return messageId; }
    public void setMessageId(UUID messageId) { this.messageId = messageId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getEmojiCode() { return emojiCode; }
    public void setEmojiCode(String emojiCode) { this.emojiCode = emojiCode; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID messageId;
        private UUID userId;
        private String emojiCode;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder messageId(UUID messageId) { this.messageId = messageId; return this; }
        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder emojiCode(String emojiCode) { this.emojiCode = emojiCode; return this; }

        public MessageReaction build() {
            return new MessageReaction(id, messageId, userId, emojiCode);
        }
    }
}

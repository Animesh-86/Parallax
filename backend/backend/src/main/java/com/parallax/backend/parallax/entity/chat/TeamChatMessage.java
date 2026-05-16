package com.parallax.backend.parallax.entity.chat;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_chat_messages", indexes = {
        @Index(name = "idx_team_chat_created", columnList = "team_id, created_at")
})
public class TeamChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, name = "team_id")
    private UUID teamId;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public TeamChatMessage() {}

    public TeamChatMessage(UUID id, UUID teamId, UUID senderId, String senderName, String content, MessageType type, Instant createdAt) {
        this.id = id;
        this.teamId = teamId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.type = type;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID teamId;
        private UUID senderId;
        private String senderName;
        private String content;
        private MessageType type;
        private Instant createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder teamId(UUID teamId) { this.teamId = teamId; return this; }
        public Builder senderId(UUID senderId) { this.senderId = senderId; return this; }
        public Builder senderName(String senderName) { this.senderName = senderName; return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Builder type(MessageType type) { this.type = type; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public TeamChatMessage build() {
            return new TeamChatMessage(id, teamId, senderId, senderName, content, type, createdAt);
        }
    }
}

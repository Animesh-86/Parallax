package com.parallax.backend.parallax.entity.chat;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "direct_messages", indexes = {
        @Index(name = "idx_dm_sender_receiver", columnList = "sender_id, receiver_id, created_at")
})
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "message_id")
    private List<MessageReaction> reactions = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "message_id")
    private List<MessageAttachment> attachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public DirectMessage() {}

    public DirectMessage(UUID id, UUID senderId, String senderName, UUID receiverId, String content, MessageType type, boolean isRead, Instant createdAt, List<MessageReaction> reactions, List<MessageAttachment> attachments) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.content = content;
        this.type = type;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.reactions = reactions != null ? reactions : new ArrayList<>();
        this.attachments = attachments != null ? attachments : new ArrayList<>();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public UUID getReceiverId() { return receiverId; }
    public void setReceiverId(UUID receiverId) { this.receiverId = receiverId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<MessageReaction> getReactions() { return reactions; }
    public void setReactions(List<MessageReaction> reactions) { this.reactions = reactions; }

    public List<MessageAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<MessageAttachment> attachments) { this.attachments = attachments; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID senderId;
        private String senderName;
        private UUID receiverId;
        private String content;
        private MessageType type;
        private boolean isRead;
        private Instant createdAt;
        private List<MessageReaction> reactions;
        private List<MessageAttachment> attachments;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder senderId(UUID senderId) { this.senderId = senderId; return this; }
        public Builder senderName(String senderName) { this.senderName = senderName; return this; }
        public Builder receiverId(UUID receiverId) { this.receiverId = receiverId; return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Builder type(MessageType type) { this.type = type; return this; }
        public Builder isRead(boolean isRead) { this.isRead = isRead; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder reactions(List<MessageReaction> reactions) { this.reactions = reactions; return this; }
        public Builder attachments(List<MessageAttachment> attachments) { this.attachments = attachments; return this; }

        public DirectMessage build() {
            return new DirectMessage(id, senderId, senderName, receiverId, content, type, isRead, createdAt, reactions, attachments);
        }
    }
}

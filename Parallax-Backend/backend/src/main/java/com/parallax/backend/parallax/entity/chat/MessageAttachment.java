package com.parallax.backend.parallax.entity.chat;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "message_attachments")
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    public MessageAttachment() {}

    public MessageAttachment(UUID id, UUID messageId, String fileName, String fileType, String fileUrl, Long fileSize) {
        this.id = id;
        this.messageId = messageId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileUrl = fileUrl;
        this.fileSize = fileSize;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMessageId() { return messageId; }
    public void setMessageId(UUID messageId) { this.messageId = messageId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID messageId;
        private String fileName;
        private String fileType;
        private String fileUrl;
        private Long fileSize;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder messageId(UUID messageId) { this.messageId = messageId; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileType(String fileType) { this.fileType = fileType; return this; }
        public Builder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }

        public MessageAttachment build() {
            return new MessageAttachment(id, messageId, fileName, fileType, fileUrl, fileSize);
        }
    }
}

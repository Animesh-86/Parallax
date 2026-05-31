package com.parallax.backend.parallax.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "code_comments")
@Data
@NoArgsConstructor
public class CodeComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private int lineNumber;

    @Column(nullable = false)
    private UUID authorUserId;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private boolean resolved = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}

package com.parallax.backend.parallax.entity.project;

import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_branches", indexes = {
        @Index(name = "idx_branch_project", columnList = "project_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_project_branch_name", columnNames = {"project_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
public class ProjectBranch {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "is_main", nullable = false)
    private boolean isMain = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ProjectBranch(Project project, String name, User createdBy, boolean isMain) {
        this.project = project;
        this.name = name;
        this.createdBy = createdBy;
        this.isMain = isMain;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}

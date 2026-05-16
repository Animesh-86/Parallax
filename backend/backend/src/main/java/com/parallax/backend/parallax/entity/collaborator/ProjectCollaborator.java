package com.parallax.backend.parallax.entity.collaborator;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_collaborators",
        uniqueConstraints = {@UniqueConstraint(name = "uk_project_user", columnNames = {"project_id", "user_id"})},
        indexes = {
                @Index(name = "idx_project_id", columnList = "project_id"),
                @Index(name = "idx_user_id", columnList = "user_id"),
                @Index(name = "idx_status", columnList = "status")
        })
public class ProjectCollaborator {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, foreignKey = @ForeignKey(name = "fk_collab_project"))
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_collab_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private CollaboratorRole role = CollaboratorRole.COLLABORATOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CollaboratorStatus status = CollaboratorStatus.PENDING;

    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    public ProjectCollaborator() {}

    public ProjectCollaborator(Project project, User user, CollaboratorRole role) {
        this.project = project;
        this.user = user;
        this.role = role == null ? CollaboratorRole.COLLABORATOR : role;
        this.status = CollaboratorStatus.PENDING;
        this.invitedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public CollaboratorRole getRole() { return role; }
    public void setRole(CollaboratorRole role) { this.role = role; }

    public CollaboratorStatus getStatus() { return status; }
    public void setStatus(CollaboratorStatus status) { this.status = status; }

    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    @Override
    public String toString() {
        return "ProjectCollaborator{" +
                "id=" + id +
                ", project=" + (project != null ? project.getId() : "null") +
                ", user=" + (user != null ? user.getId() : "null") +
                ", role=" + role +
                ", status=" + status +
                '}';
    }
}

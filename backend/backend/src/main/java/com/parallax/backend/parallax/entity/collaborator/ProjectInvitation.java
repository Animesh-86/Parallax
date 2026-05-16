package com.parallax.backend.parallax.entity.collaborator;

import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"project_id", "invitee_id"}
        )
)
public class ProjectInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    private Project project;

    @ManyToOne(optional = false)
    private User inviter;

    @ManyToOne(optional = false)
    private User invitee;

    @Enumerated(EnumType.STRING)
    private CollaboratorRole role;

    @Enumerated(EnumType.STRING)
    private InvitationStatus status;

    private Instant createdAt;

    private Instant respondedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public User getInviter() { return inviter; }
    public void setInviter(User inviter) { this.inviter = inviter; }

    public User getInvitee() { return invitee; }
    public void setInvitee(User invitee) { this.invitee = invitee; }

    public CollaboratorRole getRole() { return role; }
    public void setRole(CollaboratorRole role) { this.role = role; }

    public InvitationStatus getStatus() { return status; }
    public void setStatus(InvitationStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Instant respondedAt) { this.respondedAt = respondedAt; }

    public ProjectInvitation() {}

    public ProjectInvitation(Project project, User inviter, User invitee, CollaboratorRole role) {
        this.project = project;
        this.inviter = inviter;
        this.invitee = invitee;
        this.role = role;
        this.status = InvitationStatus.PENDING;
        this.createdAt = Instant.now();
    }
}

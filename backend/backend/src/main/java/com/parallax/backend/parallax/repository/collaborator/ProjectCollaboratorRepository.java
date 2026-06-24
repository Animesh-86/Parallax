package com.parallax.backend.parallax.repository.collaborator;

import com.parallax.backend.parallax.entity.collaborator.CollaboratorRole;
import com.parallax.backend.parallax.entity.collaborator.CollaboratorStatus;
import com.parallax.backend.parallax.entity.collaborator.ProjectCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ProjectCollaboratorRepository extends JpaRepository<ProjectCollaborator, UUID> {
    Optional<ProjectCollaborator> findByProjectIdAndUserId(UUID projectId, UUID userId);
    boolean existsByProjectIdAndUserIdAndStatus(UUID projectId, UUID userId, CollaboratorStatus status);
    
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByUserIdAndStatus(UUID userId, CollaboratorStatus status);
    
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByProjectIdAndStatus(UUID projectId, CollaboratorStatus status);
    
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByProjectId(UUID projectId);
    
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByUserId(UUID userId);
    
    long countByProjectIdAndRole(UUID projectId, CollaboratorRole role);
    void deleteByProjectId(UUID projectId);
}

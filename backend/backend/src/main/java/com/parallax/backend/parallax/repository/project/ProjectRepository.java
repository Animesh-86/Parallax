package com.parallax.backend.parallax.repository.project;

import com.parallax.backend.parallax.entity.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    boolean existsByOwner_IdAndName(UUID ownerId, String name);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Project p WHERE p.owner.id = :ownerId AND LOWER(p.name) = LOWER(:name)"
    )
    boolean existsByOwnerIdAndNameIgnoreCase(@org.springframework.data.repository.query.Param("ownerId") UUID ownerId, @org.springframework.data.repository.query.Param("name") String name);

    @EntityGraph(attributePaths = {"owner", "team"})
    List<Project> findByOwner_Id(UUID ownerId);

    @EntityGraph(attributePaths = {"owner", "team"})
    List<Project> findByTeam_Id(UUID teamId);

    java.util.Optional<Project> findByGithubRepoUrl(String githubRepoUrl);
}

package com.parallax.backend.parallax.repository.project;

import com.parallax.backend.parallax.entity.project.ProjectBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectBranchRepository extends JpaRepository<ProjectBranch, UUID> {

    List<ProjectBranch> findByProject_IdOrderByCreatedAtDesc(UUID projectId);

    Optional<ProjectBranch> findByProject_IdAndIsMainTrue(UUID projectId);

    Optional<ProjectBranch> findByProject_IdAndName(UUID projectId, String name);

    boolean existsByProject_IdAndName(UUID projectId, String name);
}

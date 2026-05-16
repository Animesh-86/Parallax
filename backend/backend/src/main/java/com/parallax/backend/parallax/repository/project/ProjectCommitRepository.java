package com.parallax.backend.parallax.repository.project;

import com.parallax.backend.parallax.entity.project.ProjectCommit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectCommitRepository extends JpaRepository<ProjectCommit, UUID> {

    List<ProjectCommit> findByProject_IdOrderByCommittedAtDesc(UUID projectId);

    List<ProjectCommit> findByBranch_IdOrderByCommittedAtDesc(UUID branchId);

    long countByProject_Id(UUID projectId);

    long countByBranch_Id(UUID branchId);
}

package com.parallax.backend.parallax.repository.project;

import com.parallax.backend.parallax.entity.project.MergeRequest;
import com.parallax.backend.parallax.entity.project.MergeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MergeRequestRepository extends JpaRepository<MergeRequest, UUID> {

    List<MergeRequest> findByProject_IdOrderByCreatedAtDesc(UUID projectId);

    List<MergeRequest> findByProject_IdAndStatusOrderByCreatedAtDesc(UUID projectId, MergeRequestStatus status);

    List<MergeRequest> findByAuthor_IdOrderByCreatedAtDesc(UUID authorId);

    long countByProject_IdAndStatus(UUID projectId, MergeRequestStatus status);
}

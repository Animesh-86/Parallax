package com.parallax.backend.parallax.repository;

import com.parallax.backend.parallax.model.CodeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CodeCommentRepository extends JpaRepository<CodeComment, UUID> {
    List<CodeComment> findByProjectIdAndFilePath(UUID projectId, String filePath);
}

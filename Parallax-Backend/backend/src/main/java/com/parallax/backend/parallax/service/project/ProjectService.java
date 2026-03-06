package com.parallax.backend.parallax.service.project;

import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.dto.project.ProjectResponse;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectResponse createProject(CreateProjectRequest request, UUID ownerId);
    ProjectResponse getProject(UUID projectId, UUID requesterId);
    List<ProjectResponse> getProjectsForUser(UUID ownerId);
}


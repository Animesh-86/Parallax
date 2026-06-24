package com.parallax.backend.parallax.dto.project;

import com.parallax.backend.parallax.dto.file.FileNodeDto;
import java.util.List;

public class WorkspaceBootstrapResponse {
    private ProjectResponse project;
    private List<FileNodeDto> fileTree;
    private List<ProjectBranchResponse> branches;
    private ProjectBranchResponse mainBranch;
    private String ideSettings;

    public WorkspaceBootstrapResponse() {}

    public WorkspaceBootstrapResponse(ProjectResponse project, List<FileNodeDto> fileTree, List<ProjectBranchResponse> branches, ProjectBranchResponse mainBranch, String ideSettings) {
        this.project = project;
        this.fileTree = fileTree;
        this.branches = branches;
        this.mainBranch = mainBranch;
        this.ideSettings = ideSettings;
    }

    public ProjectResponse getProject() { return project; }
    public void setProject(ProjectResponse project) { this.project = project; }
    public List<FileNodeDto> getFileTree() { return fileTree; }
    public void setFileTree(List<FileNodeDto> fileTree) { this.fileTree = fileTree; }
    public List<ProjectBranchResponse> getBranches() { return branches; }
    public void setBranches(List<ProjectBranchResponse> branches) { this.branches = branches; }
    public ProjectBranchResponse getMainBranch() { return mainBranch; }
    public void setMainBranch(ProjectBranchResponse mainBranch) { this.mainBranch = mainBranch; }
    public String getIdeSettings() { return ideSettings; }
    public void setIdeSettings(String ideSettings) { this.ideSettings = ideSettings; }
}

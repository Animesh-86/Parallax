import api from "./api";

// ========== TYPES ==========

export interface ProjectBranch {
  id: string;
  projectId: string;
  name: string;
  isMain: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface ProjectCommit {
  id: string;
  projectId: string;
  branchId: string;
  branchName: string;
  authorId: string;
  authorName: string;
  message: string;
  committedAt: string;
}

export type MergeRequestStatus = "OPEN" | "APPROVED" | "MERGED" | "REJECTED" | "CLOSED";

export interface MergeRequestData {
  id: string;
  projectId: string;
  sourceBranchId: string;
  sourceBranchName: string;
  targetBranchId: string;
  targetBranchName: string;
  authorId: string;
  authorName: string;
  reviewerId?: string;
  reviewerName?: string;
  title: string;
  description?: string;
  status: MergeRequestStatus;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

// ========== API ==========

export const versioningApi = {
  // Branches
  getBranches: async (projectId: string): Promise<ProjectBranch[]> => {
    const res = await api.get(`/api/projects/${projectId}/versioning/branches`);
    return res.data;
  },

  createBranch: async (projectId: string, name: string): Promise<ProjectBranch> => {
    const res = await api.post(`/api/projects/${projectId}/versioning/branches`, { name });
    return res.data;
  },

  ensureMainBranch: async (projectId: string): Promise<ProjectBranch> => {
    const res = await api.post(`/api/projects/${projectId}/versioning/branches/ensure-main`);
    return res.data;
  },

  // Commits
  getCommits: async (projectId: string): Promise<ProjectCommit[]> => {
    const res = await api.get(`/api/projects/${projectId}/versioning/commits`);
    return res.data;
  },

  getBranchCommits: async (projectId: string, branchId: string): Promise<ProjectCommit[]> => {
    const res = await api.get(`/api/projects/${projectId}/versioning/branches/${branchId}/commits`);
    return res.data;
  },

  createCommit: async (projectId: string, branchId: string, message: string): Promise<ProjectCommit> => {
    const res = await api.post(`/api/projects/${projectId}/versioning/commits`, { branchId, message });
    return res.data;
  },

  // Merge Requests
  getMergeRequests: async (projectId: string): Promise<MergeRequestData[]> => {
    const res = await api.get(`/api/projects/${projectId}/versioning/merge-requests`);
    return res.data;
  },

  getOpenMergeRequests: async (projectId: string): Promise<MergeRequestData[]> => {
    const res = await api.get(`/api/projects/${projectId}/versioning/merge-requests/open`);
    return res.data;
  },

  createMergeRequest: async (
    projectId: string,
    sourceBranchId: string,
    targetBranchId: string,
    title: string,
    description?: string
  ): Promise<MergeRequestData> => {
    const res = await api.post(`/api/projects/${projectId}/versioning/merge-requests`, {
      sourceBranchId,
      targetBranchId,
      title,
      description: description || "",
    });
    return res.data;
  },

  updateMergeRequestStatus: async (
    projectId: string,
    mrId: string,
    status: MergeRequestStatus
  ): Promise<MergeRequestData> => {
    const res = await api.patch(`/api/projects/${projectId}/versioning/merge-requests/${mrId}`, {
      status,
    });
    return res.data;
  },
};

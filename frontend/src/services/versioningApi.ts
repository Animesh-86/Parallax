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
  // Remote
  addRemote: async (projectId: string, url: string): Promise<{ message: string }> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/remote`, { url });
    return res.data;
  },

  // Branches
  getBranches: async (projectId: string): Promise<ProjectBranch[]> => {
    const res = await api.get(`/api/v1/projects/${projectId}/git/branches`);
    return res.data;
  },

  createBranch: async (projectId: string, name: string): Promise<ProjectBranch> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/branches`, { name });
    return res.data;
  },

  deleteBranch: async (projectId: string, name: string): Promise<void> => {
    await api.delete(`/api/v1/projects/${projectId}/git/branches/${encodeURIComponent(name)}`);
  },

  ensureMainBranch: async (projectId: string): Promise<ProjectBranch> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/branches/ensure-main`);
    return res.data;
  },

  checkoutBranch: async (projectId: string, branchName: string): Promise<void> => {
    await api.post(`/api/v1/projects/${projectId}/git/branches/${branchName}/checkout`);
  },

  pushBranch: async (projectId: string, branchName: string): Promise<{ message: string }> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/branches/${branchName}/push`);
    return res.data;
  },

  // Commits
  getCommits: async (projectId: string, branchId?: string): Promise<ProjectCommit[]> => {
    const url = branchId
      ? `/api/v1/projects/${projectId}/git/branches/${encodeURIComponent(branchId)}/commits`
      : `/api/v1/projects/${projectId}/git/commits`;
    const res = await api.get(url);
    return res.data;
  },

  getBranchCommits: async (projectId: string, branchId: string): Promise<ProjectCommit[]> => {
    const res = await api.get(`/api/v1/projects/${projectId}/git/branches/${branchId}/commits`);
    return res.data;
  },

  createCommit: async (projectId: string, branchId: string, message: string): Promise<ProjectCommit> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/commits`, { branchId, message });
    return res.data;
  },

  // Merge Requests
  getMergeRequests: async (projectId: string): Promise<MergeRequestData[]> => {
    const res = await api.get(`/api/v1/projects/${projectId}/git/merge-requests`);
    return res.data;
  },

  getOpenMergeRequests: async (projectId: string): Promise<MergeRequestData[]> => {
    const res = await api.get(`/api/v1/projects/${projectId}/git/merge-requests/open`);
    return res.data;
  },

  createMergeRequest: async (
    projectId: string,
    sourceBranchId: string,
    targetBranchId: string,
    title: string,
    description?: string
  ): Promise<MergeRequestData> => {
    const res = await api.post(`/api/v1/projects/${projectId}/git/merge-requests`, {
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
    const res = await api.patch(`/api/v1/projects/${projectId}/git/merge-requests/${mrId}`, {
      status,
    });
    return res.data;
  },

  // Utils
  getDiff: async (projectId: string): Promise<{ diff: string }> => {
    const res = await api.get(`/api/v1/projects/${projectId}/git/diff`);
    return res.data;
  }
};

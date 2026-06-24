import api from "./api";

export interface CreatePullRequestPayload {
  branchName: string;
  title: string;
  message: string;
}

export const githubApi = {
  createPullRequest: async (projectId: string, payload: CreatePullRequestPayload) => {
    const res = await api.post(`/api/v1/projects/${projectId}/github/pr`, payload);
    return res.data;
  },
};

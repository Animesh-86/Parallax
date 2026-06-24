import api from "./api";

export interface ProjectSettings {
  name: string;
  language: string;
  description?: string;
  settingsJson?: string;
  enabledExtensionsJson?: string;
  teamId?: string;
  teamName?: string;
  runtimeName?: string;
  githubRepoUrl?: string;
  aiReviewEnabled?: boolean;
}

export interface UpdateSettingsRequest {
  name?: string;
  description?: string;
  settingsJson?: string;
  githubRepoUrl?: string;
  aiReviewEnabled?: boolean;
}

export const projectSettingsApi = {
  updateSettings: async (projectId: string, data: UpdateSettingsRequest) => {
    const res = await api.patch(`/api/v1/projects/${projectId}`, data);
    return res.data;
  },

  toggleExtension: async (projectId: string, extensionId: string, enabled: boolean) => {
    const res = await api.patch(`/api/v1/projects/${projectId}/extensions`, {
      extensionId,
      enabled
    });
    return res.data;
  },

  getProjectDetails: async (projectId: string): Promise<ProjectSettings> => {
    const res = await api.get(`/api/v1/projects/${projectId}`);
    return res.data;
  },

  deleteProject: async (projectId: string) => {
    const res = await api.delete(`/api/v1/projects/${projectId}`);
    return res.data;
  },

  archiveProject: async (projectId: string) => {
    const res = await api.patch(`/api/v1/projects/${projectId}/archive`);
    return res.data;
  },

  unarchiveProject: async (projectId: string) => {
    const res = await api.patch(`/api/v1/projects/${projectId}/unarchive`);
    return res.data;
  }
};

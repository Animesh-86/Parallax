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
}

export interface UpdateSettingsRequest {
  name?: string;
  description?: string;
  settingsJson?: string;
}

export const projectSettingsApi = {
  updateSettings: async (projectId: string, data: UpdateSettingsRequest) => {
    const res = await api.put(`/projects/${projectId}/settings`, data);
    return res.data;
  },

  toggleExtension: async (projectId: string, extensionId: string, enabled: boolean) => {
    const res = await api.post(`/projects/${projectId}/extensions/toggle`, {
      extensionId,
      enabled
    });
    return res.data;
  },

  getProjectDetails: async (projectId: string): Promise<ProjectSettings> => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  deleteProject: async (projectId: string) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  }
};

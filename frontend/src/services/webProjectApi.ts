import api from './api';

export interface WebProjectStatus {
  status: 'RUNNING' | 'STOPPED';
  port: number | null;
}

export const webProjectApi = {
  startServer: async (projectId: string): Promise<WebProjectStatus> => {
    const response = await api.post(`/api/projects/${projectId}/web/start`);
    return response.data;
  },
  
  stopServer: async (projectId: string): Promise<{message: string}> => {
    const response = await api.post(`/api/projects/${projectId}/web/stop`);
    return response.data;
  },
  
  getStatus: async (projectId: string): Promise<WebProjectStatus> => {
    const response = await api.get(`/api/projects/${projectId}/web/status`);
    return response.data;
  }
};

import api from './api';

export interface WebProjectStatus {
  status: 'RUNNING' | 'STOPPED';
  port: number | null;
}

export const webProjectApi = {
  startServer: async (projectId: string): Promise<WebProjectStatus> => {
    const response = await api.post(`/api/v1/projects/${projectId}/web-server`);
    return response.data;
  },
  
  stopServer: async (projectId: string): Promise<{message: string}> => {
    const response = await api.delete(`/api/v1/projects/${projectId}/web-server`);
    return response.data;
  },
  
  getStatus: async (projectId: string): Promise<WebProjectStatus> => {
    const response = await api.get(`/api/v1/projects/${projectId}/web-server`);
    return response.data;
  }
};

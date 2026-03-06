import axios from 'axios';

const API_BASE_URL = '/api/projects';

// Fetch file tree
export const fetchFileTree = async (projectId: string) => {
  const response = await axios.get(`${API_BASE_URL}/${projectId}/files`);
  return response.data;
};

// Create a new file or folder
export const createFile = async (
  projectId: string,
  path: string,
  type: 'FILE' | 'FOLDER'
) => {
  const response = await axios.post(`${API_BASE_URL}/${projectId}/files`, {
    path,
    type,
  });
  return response.data;
};

// Delete a file (not implemented in backend, placeholder)
export const deleteFile = async (projectId: string, path: string) => {
  const response = await axios.delete(`${API_BASE_URL}/${projectId}/file`, {
    params: { path },
  });
  return response.data;
};
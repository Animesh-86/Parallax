import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export async function fetchFileTree(projectId: string) {
  const res = await api.get(`/projects/${projectId}/files/tree`);
  return res.data;
}

export async function fetchFile(projectId: string, path: string) {
  const res = await api.get(`/projects/${projectId}/file`, {
    params: { path },
  });
  return res.data;
}

export async function saveFile(projectId: string, path: string, content: string) {
  await api.put(`/projects/${projectId}/file`, content, {
    params: { path },
    headers: { "Content-Type": "text/plain" },
  });
}

export async function createFile(
  projectId: string,
  path: string,
  type: "FILE" | "FOLDER"
) {
  await api.post(`/projects/${projectId}/files`, { path, type });
}

export async function deleteFile(projectId: string, path: string) {
  await api.delete(`/projects/${projectId}/file`, { params: { path } });
}

import api from "./api";

export async function fetchFileTree(projectId: string) {
  const res = await api.get(`/api/v1/projects/${projectId}/files/tree`);
  return res.data;
}

export async function fetchFile(projectId: string, path: string) {
  const res = await api.get(`/api/v1/projects/${projectId}/file`, {
    params: { path },
  });
  return res.data;
}

export async function saveFile(projectId: string, path: string, content: string) {
  await api.put(`/api/v1/projects/${projectId}/file`, content, {
    params: { path },
    headers: { "Content-Type": "text/plain" },
  });
}

export async function createFile(
  projectId: string,
  path: string,
  type: "FILE" | "FOLDER"
) {
  await api.post(`/api/v1/projects/${projectId}/files`, { path, type });
}

export async function deleteFile(projectId: string, path: string) {
  await api.delete(`/api/v1/projects/${projectId}/file`, { params: { path } });
}

export interface FileSearchResult {
  path: string;
  lineNumber: number;
  lineContent: string;
}

export async function searchFiles(projectId: string, query: string): Promise<FileSearchResult[]> {
  const res = await api.get(`/api/v1/projects/${projectId}/search`, { params: { query } });
  return res.data;
}

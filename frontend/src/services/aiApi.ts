import api from "./api";

export interface AiChatRequest {
  prompt: string;
  activeFileContent?: string;
  activeFileName?: string;
}

export interface AiChatResponse {
  reply: string;
}

export const aiApi = {
  chat: async (request: AiChatRequest): Promise<AiChatResponse> => {
    const response = await api.post("/api/ai/chat", request);
    return response.data;
  },
};

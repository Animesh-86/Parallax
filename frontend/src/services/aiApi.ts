import api from "./api";

export interface AiChatRequest {
  prompt: string;
  activeFileContent?: string;
  activeFileName?: string;
}

export interface AiChatResponse {
  reply: string;
}

export interface AiAutocompleteRequest {
  prefix: string;
  suffix: string;
}

export interface AiAutocompleteResponse {
  completion: string;
}

export interface AiCommitMessageRequest {
  diff: string;
}

export const aiApi = {
  chat: async (request: AiChatRequest): Promise<AiChatResponse> => {
    const response = await api.post("/api/v1/ai/chat", request);
    return response.data;
  },
  autocomplete: async (request: AiAutocompleteRequest): Promise<AiAutocompleteResponse> => {
    const response = await api.post("/api/v1/ai/autocomplete", request);
    return response.data;
  },
  generateCommitMessage: async (request: AiCommitMessageRequest): Promise<AiChatResponse> => {
    const response = await api.post("/api/v1/ai/generate-commit-message", request);
    return response.data;
  }
};

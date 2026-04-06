const defaultApiBaseUrl = "http://localhost:8080";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
export const wsSockJsEndpoint = `${apiBaseUrl}/ws`;
export const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws");

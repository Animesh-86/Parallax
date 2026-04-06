const defaultApiBaseUrl = "http://localhost:8080";
const defaultWsBaseUrl = "ws://localhost:8080";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
export const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || defaultWsBaseUrl;
export const oauthBaseUrl = import.meta.env.VITE_OAUTH_BASE_URL || apiBaseUrl;

export const wsSockJsEndpoint = `${apiBaseUrl}/ws`;

export const apiPath = (path: string): string => `${apiBaseUrl}${path}`;

export const oauthAuthorizationUrl = (provider: "google" | "github"): string =>
  `${oauthBaseUrl}/oauth2/authorization/${provider}`;

export const wsChatEndpoint = (projectId: string, token: string): string =>
  `${wsBaseUrl}/ws/chat/${projectId}?token=${encodeURIComponent(token)}`;

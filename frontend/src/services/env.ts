const defaultApiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const apiBaseUrl = typeof window !== 'undefined'
  ? (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`)
  : defaultApiBaseUrl;

export const apiWsUrl = typeof window !== 'undefined'
  ? (import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`)
  : "ws://localhost:8080";

export const previewDomain = import.meta.env.VITE_PREVIEW_DOMAIN || "localhost";
export const wsSockJsEndpoint = `${apiBaseUrl}/api/v1/ws`;
export const wsBaseUrl = `${apiBaseUrl.replace(/^http/, "ws")}/api/v1`;

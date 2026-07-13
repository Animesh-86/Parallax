const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
const defaultApiBaseUrl = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

const computedUrl = typeof window !== 'undefined'
  ? (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`)
  : defaultApiBaseUrl;

export const apiBaseUrl = computedUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

const rawWsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const defaultWsUrl = rawWsUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

const computedWsUrl = typeof window !== 'undefined'
  ? (import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`)
  : defaultWsUrl;

export const apiWsUrl = computedWsUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

export const previewDomain = import.meta.env.VITE_PREVIEW_DOMAIN || "localhost";
export const wsSockJsEndpoint = `${apiBaseUrl}/api/v1/ws`;
export const wsBaseUrl = `${apiBaseUrl.replace(/^http/, "ws")}/api/v1`;

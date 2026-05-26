import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { RunCodeBroadcastMessage, RunCodeRequestWS } from "../types/wsTypes";
import { wsSockJsEndpoint, apiBaseUrl } from "./env";

let runClient: Client | null = null;
let currentOutputCallback: ((msg: RunCodeBroadcastMessage) => void) | null = null;
let currentProjectId: string | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

/**
 * Attempts to refresh the access token using the HttpOnly refresh_token cookie.
 */
async function refreshAccessToken(): Promise<string | null> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.accessToken) {
            localStorage.setItem("access_token", data.accessToken);
            return data.accessToken;
        }
        return null;
    } catch {
        return null;
    }
}

function createAndActivate(projectId: string) {
    const token = localStorage.getItem("access_token");

    runClient = new Client({
        webSocketFactory: () => new SockJS(wsSockJsEndpoint),
        reconnectDelay: 0, // We handle reconnection ourselves
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });

    runClient.onConnect = () => {
        console.log("🟢 Run WebSocket connected");
        reconnectAttempts = 0;

        runClient!.subscribe(
            `/topic/projects/${projectId}/run-output`,
            (frame: IMessage) => {
                try {
                    const msg = JSON.parse(frame.body);
                    if (currentOutputCallback) {
                        currentOutputCallback(msg);
                    }
                } catch (err) {
                    console.error("❌ Error parsing run output:", err);
                }
            },
            {
                Authorization: `Bearer ${token}`,
            }
        );
    };

    runClient.onStompError = (frame) => {
        console.error("❌ STOMP error on Run socket:", frame);
        const errorMessage = frame.headers?.message || "";
        if (errorMessage.includes("expired") || errorMessage.includes("401")) {
            handleAuthFailure();
        }
    };

    runClient.onWebSocketError = (evt) => {
        console.error("❌ Run WebSocket low-level error:", evt);
    };

    runClient.onWebSocketClose = () => {
        if (currentProjectId) {
            handleReconnect();
        }
    };

    runClient.activate();
}

async function handleAuthFailure() {
    console.log("🔄 Run WS auth failed, attempting token refresh...");
    const newToken = await refreshAccessToken();
    if (newToken && currentProjectId) {
        deactivateClient();
        createAndActivate(currentProjectId);
    } else {
        console.error("❌ Token refresh failed for Run WS.");
    }
}

function handleReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error("❌ Max Run WebSocket reconnection attempts reached.");
        return;
    }

    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`🔄 Run WS reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

    setTimeout(async () => {
        await refreshAccessToken();
        if (currentProjectId) {
            deactivateClient();
            createAndActivate(currentProjectId);
        }
    }, delay);
}

function deactivateClient() {
    if (runClient) {
        try { runClient.deactivate(); } catch { /* ignore */ }
        runClient = null;
    }
}

export function connectRunSocket(projectId: string, onOutput: (msg: RunCodeBroadcastMessage) => void) {
    currentOutputCallback = onOutput;

    if (runClient?.active && currentProjectId === projectId) return;

    currentProjectId = projectId;
    reconnectAttempts = 0;
    deactivateClient();
    createAndActivate(projectId);
}

export function sendRunRequest(projectId: string, payload: Omit<RunCodeRequestWS, "token">) {
    if (!runClient?.connected) {
        throw new Error("Run WebSocket is not connected");
    }

    const token = localStorage.getItem("access_token");

    try {
        runClient.publish({
            destination: `/app/projects/${projectId}/run`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error("❌ Failed to publish run request:", err);
        throw err;
    }
}

export function disconnectRunSocket() {
    currentProjectId = null;
    currentOutputCallback = null;
    reconnectAttempts = 0;
    deactivateClient();
}

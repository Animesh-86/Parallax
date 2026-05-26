import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { CodeEditMessage } from "../types/wsTypes";
import { wsSockJsEndpoint, apiBaseUrl } from "./env";

/**
 * Attempts to refresh the access token using the HttpOnly refresh_token cookie.
 * Returns the new access token, or null if refresh fails.
 */
async function refreshAccessToken(): Promise<string | null> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
            method: "POST",
            credentials: "include", // sends refresh_token cookie
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

class CodeWebSocketService {
    private client: Client | null = null;
    private projectId: string | null = null;
    private onMessage: ((msg: CodeEditMessage) => void) | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(projectId: string, onMessage: (msg: CodeEditMessage) => void) {
        // If already connected to the same project, just update callback
        if (this.client?.connected && this.projectId === projectId) {
            console.log("🟢 Code WS already connected to project", projectId);
            this.onMessage = onMessage;
            return;
        }

        // If connected to a different project, disconnect first
        if (this.client) {
            this.disconnect();
        }

        this.projectId = projectId;
        this.onMessage = onMessage;
        this.reconnectAttempts = 0;

        this.createAndActivate(projectId);
    }

    private createAndActivate(projectId: string) {
        const token = localStorage.getItem("access_token");

        this.client = new Client({
            webSocketFactory: () => new SockJS(wsSockJsEndpoint),
            reconnectDelay: 0, // We handle reconnection ourselves
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log(`[CodeWS]: ${str}`),
        });

        this.client.onConnect = () => {
            console.log(`🟢 Code WebSocket connected for project ${projectId}`);
            this.reconnectAttempts = 0; // Reset on successful connect
            this.client?.subscribe(`/topic/projects/${projectId}/code`, (frame: IMessage) => {
                if (this.onMessage) {
                    try {
                        const msg = JSON.parse(frame.body);
                        this.onMessage(msg);
                    } catch (e) {
                        console.error("Failed to parse code edit message", e);
                    }
                }
            });
        };

        this.client.onStompError = (frame) => {
            console.error("❌ Code WS Stomp Error", frame);
            // If the error is auth-related, try refreshing the token
            const errorMessage = frame.headers?.message || "";
            if (errorMessage.includes("expired") || errorMessage.includes("401")) {
                this.handleAuthFailure();
            }
        };

        this.client.onWebSocketClose = () => {
            if (this.projectId) {
                // Connection was not deliberately closed
                this.handleReconnect();
            }
        };

        this.client.activate();
    }

    private async handleAuthFailure() {
        console.log("🔄 WebSocket auth failed, attempting token refresh...");
        const newToken = await refreshAccessToken();
        if (newToken && this.projectId) {
            console.log("✅ Token refreshed, reconnecting WebSocket...");
            this.deactivateClient();
            this.createAndActivate(this.projectId);
        } else {
            console.error("❌ Token refresh failed. Redirecting to login.");
            window.location.href = "/login";
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("❌ Max WebSocket reconnection attempts reached. Giving up.");
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        console.log(`🔄 WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            // Try refreshing token before reconnect
            const newToken = await refreshAccessToken();
            if (newToken && this.projectId) {
                this.deactivateClient();
                this.createAndActivate(this.projectId);
            } else if (this.projectId) {
                // Use existing token for reconnect
                this.deactivateClient();
                this.createAndActivate(this.projectId);
            }
        }, delay);
    }

    sendEdit(projectId: string, msg: Omit<CodeEditMessage, "token">) {
        if (!this.client?.connected) {
            console.warn("⚠️ Code WS not connected, queuing or dropping message");
            return;
        }

        this.client.publish({
            destination: `/app/projects/${projectId}/edit`,
            body: JSON.stringify({
                ...msg,
                token: localStorage.getItem("access_token"),
            }),
        });
    }

    private deactivateClient() {
        if (this.client) {
            try {
                this.client.deactivate();
            } catch {
                // Ignore deactivation errors during reconnect
            }
            this.client = null;
        }
    }

    disconnect() {
        const savedProjectId = this.projectId;
        this.projectId = null; // Prevent reconnect handler from firing
        this.onMessage = null;
        this.reconnectAttempts = 0;

        if (this.client) {
            console.log("🔴 Disconnecting Code WS");
            this.deactivateClient();
        }
    }
}

export const codeWs = new CodeWebSocketService();

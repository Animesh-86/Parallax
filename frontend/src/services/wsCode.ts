import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { CodeEditMessage } from "../types/wsTypes";
import { wsSockJsEndpoint } from "./env";

class CodeWebSocketService {
    private client: Client | null = null;
    private projectId: string | null = null;
    private onMessage: ((msg: CodeEditMessage) => void) | null = null;

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
        const token = localStorage.getItem("access_token");

        this.client = new Client({
            webSocketFactory: () => new SockJS(wsSockJsEndpoint),
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log(`[CodeWS]: ${str}`),
        });

        this.client.onConnect = () => {
            console.log(`🟢 Code WebSocket connected for project ${projectId}`);
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
        };

        this.client.activate();
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

    disconnect() {
        if (this.client) {
            console.log("🔴 Disconnecting Code WS");
            this.client.deactivate();
            this.client = null;
        }
        this.projectId = null;
        this.onMessage = null;
    }
}

export const codeWs = new CodeWebSocketService();

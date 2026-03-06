
export type ChatMessage = {
    id?: string;
    projectId: string;
    senderId?: string | null;
    senderName: string;
    content: string;
    type: "USER" | "SYSTEM";
    createdAt?: string;
};

type ChatHistoryPayload = {
    type: "HISTORY";
    messages: ChatMessage[];
};

class ChatWebSocketService {
    private ws: WebSocket | null = null;
    private projectId: string | null = null;
    private onMessage: ((msg: ChatMessage) => void) | null = null;
    private onHistory: ((msgs: ChatMessage[]) => void) | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isExplicitDisconnect = false;

    connect(projectId: string, onMessage: (msg: ChatMessage) => void, onHistory: (msgs: ChatMessage[]) => void) {
        if (this.ws?.readyState === WebSocket.OPEN && this.projectId === projectId) {
            console.log("🟢 Chat WS already connected to project", projectId);
            this.onMessage = onMessage;
            this.onHistory = onHistory;
            return;
        }

        if (this.ws) {
            this.disconnect();
        }

        this.projectId = projectId;
        this.onMessage = onMessage;
        this.onHistory = onHistory;
        this.isExplicitDisconnect = false;

        const token = localStorage.getItem("access_token");
        // WebSocket URL: ws://localhost:8080/ws/chat/{projectId}?token={token}
        const url = `ws://localhost:8080/ws/chat/${projectId}?token=${token}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log(`🟢 Chat WebSocket connected for project ${projectId}`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Check if it's history payload or single message
                if (data.type === "HISTORY" && Array.isArray(data.messages)) {
                    if (this.onHistory) this.onHistory(data.messages);
                } else if (data.content && data.senderName) {
                    // It's a single chat message
                    if (this.onMessage) this.onMessage(data as ChatMessage);
                }
            } catch (e) {
                console.error("Failed to parse chat message", e);
            }
        };

        this.ws.onclose = () => {
            if (!this.isExplicitDisconnect) {
                console.warn("⚠️ Chat WS disconnected, reconnecting in 5s...");
                this.reconnectTimeout = setTimeout(() => {
                    this.connect(projectId, onMessage, onHistory);
                }, 5000);
            } else {
                console.log("🔴 Chat WS disconnected explicitly");
            }
        };

        this.ws.onerror = (err) => {
            console.error("❌ Chat WS Error", err);
            // Close will trigger reconnect
        };
    }

    sendMessage(content: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ content }));
        } else {
            console.warn("⚠️ Chat WS not open, cannot send message");
        }
    }

    disconnect() {
        this.isExplicitDisconnect = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.projectId = null;
        this.onMessage = null;
        this.onHistory = null;
    }
}

export const chatWs = new ChatWebSocketService();

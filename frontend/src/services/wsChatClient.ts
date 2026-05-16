import { wsBaseUrl } from "./env";

export type GenericChatMessage = {
    id?: string;
    senderId?: string | null;
    senderName: string;
    content: string;
    type: "USER" | "SYSTEM";
    createdAt?: string;
    projectId?: string; 
    teamId?: string;    
    receiverId?: string; 
    reactions?: Array<{ id: string; userId: string; emojiCode: string }>;
    attachments?: Array<{ fileName: string; fileType: string; fileUrl: string; fileSize: number }>;
};

type ChatHistoryPayload = {
    type: "HISTORY";
    messages: GenericChatMessage[];
};

export class ChatWebSocketClient {
    private ws: WebSocket | null = null;
    private contextId: string | null = null;
    private contextType: "PROJECT" | "TEAM" | "DIRECT" | null = null;
    private onMessage: ((msg: GenericChatMessage) => void) | null = null;
    private onHistory: ((msgs: GenericChatMessage[]) => void) | null = null;
    private onSignal: ((signal: { type: string; senderId: string; data: any }) => void) | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isExplicitDisconnect = false;

    connect(
        contextId: string, 
        contextType: "PROJECT" | "TEAM" | "DIRECT", 
        onMessage: (msg: GenericChatMessage) => void, 
        onHistory: (msgs: GenericChatMessage[]) => void,
        onSignal?: (signal: { type: string; senderId: string; data: any }) => void
    ) {
        if (this.ws?.readyState === WebSocket.OPEN && this.contextId === contextId && this.contextType === contextType) {
            console.log(`🟢 ${contextType} Chat WS already connected to ${contextId}`);
            this.onMessage = onMessage;
            this.onHistory = onHistory;
            return;
        }

        if (this.ws) {
            this.disconnect();
        }

        this.contextId = contextId;
        this.contextType = contextType;
        this.onMessage = onMessage;
        this.onHistory = onHistory;
        this.onSignal = onSignal || null;
        this.isExplicitDisconnect = false;

        const token = localStorage.getItem("access_token");
        
        // Construct correct endpoint based on type
        let endpoint = "chat";
        if (contextType === "TEAM") endpoint = "team-chat";
        else if (contextType === "DIRECT") endpoint = "direct-chat";
        
        const url = contextType === "DIRECT" 
            ? `${wsBaseUrl}/ws/${endpoint}?token=${token}` 
            : `${wsBaseUrl}/ws/${endpoint}/${contextId}?token=${token}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log(`🟢 ${contextType} Chat WebSocket connected for ${contextId}`);
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
                } else if (data.type === "CALL_SIGNAL") {
                    if (this.onSignal) this.onSignal(data);
                } else if (data.content && data.senderName) {
                    // It's a single chat message
                    if (this.onMessage) this.onMessage(data as GenericChatMessage);
                }
            } catch (e) {
                console.error(`Failed to parse ${contextType} chat message`, e);
            }
        };

        this.ws.onclose = () => {
            if (!this.isExplicitDisconnect) {
                console.warn(`⚠️ ${contextType} Chat WS disconnected, reconnecting in 5s...`);
                this.reconnectTimeout = setTimeout(() => {
                    this.connect(contextId, contextType, onMessage, onHistory);
                }, 5000);
            } else {
                console.log(`🔴 ${contextType} Chat WS disconnected explicitly`);
            }
        };

        this.ws.onerror = (err) => {
            console.error(`❌ ${contextType} Chat WS Error`, err);
            // Close will trigger reconnect
        };
    }

    sendMessage(content: string, receiverId?: string, attachments?: any[]) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            if (this.contextType === "DIRECT" && receiverId) {
                this.ws.send(JSON.stringify({ content, receiverId, attachments }));
            } else {
                this.ws.send(JSON.stringify({ content, attachments }));
            }
        } else {
            console.warn(`⚠️ ${this.contextType} Chat WS not open, cannot send message`);
        }
    }

    sendReaction(messageId: string, emoji: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ reaction: true, messageId, emoji }));
        }
    }

    sendSignal(receiverId: string, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ signal: true, receiverId, data }));
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
        this.contextId = null;
        this.contextType = null;
        this.onMessage = null;
        this.onHistory = null;
    }
}

// Export singleton instances for backward compatibility or global usage if needed
export const projectChatWs = new ChatWebSocketClient();
export const teamChatWsClient = new ChatWebSocketClient();
export const directChatWsClient = new ChatWebSocketClient();

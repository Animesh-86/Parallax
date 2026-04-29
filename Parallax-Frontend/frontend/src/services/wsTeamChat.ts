import { wsBaseUrl } from "./env";

export type TeamChatMessage = {
    id?: string;
    teamId: string;
    senderId?: string | null;
    senderName: string;
    content: string;
    type: "USER" | "SYSTEM";
    createdAt?: string;
};

type TeamChatHistoryPayload = {
    type: "HISTORY";
    messages: TeamChatMessage[];
};

class TeamChatWebSocketService {
    private ws: WebSocket | null = null;
    private teamId: string | null = null;
    private onMessage: ((msg: TeamChatMessage) => void) | null = null;
    private onHistory: ((msgs: TeamChatMessage[]) => void) | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isExplicitDisconnect = false;

    connect(teamId: string, onMessage: (msg: TeamChatMessage) => void, onHistory: (msgs: TeamChatMessage[]) => void) {
        if (this.ws?.readyState === WebSocket.OPEN && this.teamId === teamId) {
            this.onMessage = onMessage;
            this.onHistory = onHistory;
            return;
        }

        if (this.ws) {
            this.disconnect();
        }

        this.teamId = teamId;
        this.onMessage = onMessage;
        this.onHistory = onHistory;
        this.isExplicitDisconnect = false;

        const token = localStorage.getItem("access_token");
        const url = `${wsBaseUrl}/ws/team-chat/${teamId}?token=${token}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log(`🟢 Team Chat WS connected for team ${teamId}`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "HISTORY" && Array.isArray(data.messages)) {
                    if (this.onHistory) this.onHistory(data.messages);
                } else if (data.content && data.senderName) {
                    if (this.onMessage) this.onMessage(data as TeamChatMessage);
                }
            } catch (e) {
                console.error("Failed to parse team chat message", e);
            }
        };

        this.ws.onclose = () => {
            if (!this.isExplicitDisconnect) {
                console.warn("⚠️ Team Chat WS disconnected, reconnecting in 5s...");
                this.reconnectTimeout = setTimeout(() => {
                    this.connect(teamId, onMessage, onHistory);
                }, 5000);
            }
        };

        this.ws.onerror = (err) => {
            console.error("❌ Team Chat WS Error", err);
        };
    }

    sendMessage(content: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ content }));
        } else {
            console.warn("⚠️ Team Chat WS not open, cannot send message");
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
        this.teamId = null;
        this.onMessage = null;
        this.onHistory = null;
    }
}

export const teamChatWs = new TeamChatWebSocketService();

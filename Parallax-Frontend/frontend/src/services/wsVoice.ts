import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { jwtDecode } from "jwt-decode";
import { wsSockJsEndpoint } from "./env";

// Types matching V1 Spec
export type SignalType = "CALL_JOIN" | "CALL_LEAVE" | "CALL_OFFER" | "CALL_ANSWER" | "CALL_ICE" | "CALL_PRESENCE" | "CALL_SCREEN_SHARE";

export interface SignalMessage {
    type: SignalType;
    payload?: any; // Offer/Answer/Candidate or empty for Join/Leave
    senderId: string;
    targetId?: string; // For direct signaling (Offer/Answer/Ice)
}

export interface CallParticipantsMessage {
    type: "CALL_PARTICIPANTS";
    participants: string[]; // List of userIds currently in call
}

class VoiceWebSocketService {
    private client: Client | null = null;
    private userId: string | null = null;
    private channelId: string | null = null;
    private channelType: "project" | "room" = "project";
    private onSignal: ((signal: SignalMessage | CallParticipantsMessage) => void) | null = null;
    private verboseLogsEnabled = localStorage.getItem("voice_ws_debug") === "1";

    connect(channelId: string, channelType: "project" | "room" = "project", onSignal: (signal: SignalMessage | CallParticipantsMessage) => void, onDisconnect?: () => void): Promise<void> {
        this.channelId = channelId;
        this.channelType = channelType;
        this.onSignal = onSignal;

        return new Promise((resolve, reject) => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.error("No token found for voice WS");
                reject("No token");
                return;
            }

            try {
                const decoded = jwtDecode(token) as any;
                this.userId = decoded.userId || decoded.sub;
            } catch (e) {
                console.error("Invalid token", e);
                reject("Invalid token");
                return;
            }

            this.client = new Client({
                webSocketFactory: () => new SockJS(wsSockJsEndpoint),
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 5000,
                debug: (str) => {
                    if (this.verboseLogsEnabled) {
                        console.log(`[VoiceWS]: ${str}`);
                    }
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                    reject(frame.headers['message']);
                },
                onWebSocketClose: () => {
                    console.warn("Voice WebSocket closed");
                    if (onDisconnect) onDisconnect();
                }
            });

            this.client.onConnect = () => {
                console.log("🟢 Voice WebSocket connected (V1).");
                resolve();

                // Subscribe to dynamic CALL topic
                const topicUrl = this.channelType === "room" ? `/topic/rooms/${channelId}/call` : `/topic/project/${channelId}/call`;
                this.client?.subscribe(topicUrl, (message: IMessage) => {
                    if (this.onSignal) {
                        try {
                            const signal = JSON.parse(message.body);
                            // Filter out own messages if backend echoes them
                            // (Unless it's a Participants list which might include valid info)
                            if (signal.senderId && signal.senderId === this.userId) {
                                return;
                            }
                            this.onSignal(signal);
                        } catch (e) {
                            console.error("Error parsing voice signal", e);
                        }
                    }
                });

                // Subscribe to User Queue for direct messages
                const queueUrl = this.channelType === "room" ? `/user/queue/rooms/call` : `/user/queue/call`;
                this.client?.subscribe(queueUrl, (message: IMessage) => {
                    if (this.onSignal) {
                        try {
                            const msg = JSON.parse(message.body);
                            this.onSignal(msg);
                        } catch (e) {
                            console.error("Error parsing user queue message", e);
                        }
                    }
                });
            };

            this.client.activate();
        });
    }

    sendSignal(signal: Omit<SignalMessage, "payload"> & { payload?: any }) {
        if (!this.client?.connected || !this.channelId) {
            console.warn("Voice WS not connected, cannot send signal", signal.type);
            return;
        }

        const appUrl = this.channelType === "room" ? `/app/rooms/${this.channelId}/call` : `/app/project/${this.channelId}/call`;
        this.client.publish({
            destination: appUrl,
            body: JSON.stringify(signal),
        });
    }

    disconnect() {
        if (this.client) {
            if (this.userId) {
                // Best effort leave
                try {
                    this.sendSignal({ type: "CALL_LEAVE", senderId: this.userId });
                } catch (e) { /* ignore */ }
            }
            this.client.deactivate();
            this.client = null;
        }
        this.channelId = null;
        this.onSignal = null;
    }

    // --- WHITEBOARD SYNC ---
    subscribeWhiteboard(onUpdate: (payload: any) => void) {
        if (!this.client?.connected || !this.channelId) return;
        const topicUrl = this.channelType === "room" ? `/topic/rooms/${this.channelId}/whiteboard` : `/topic/project/${this.channelId}/whiteboard`;
        
        return this.client.subscribe(topicUrl, (message: IMessage) => {
            try {
                const payload = JSON.parse(message.body);
                // Simple anti-echo check if payload contains senderId
                if (payload.senderId && payload.senderId === this.userId) return;
                onUpdate(payload);
            } catch (e) {
                console.error("Error parsing whiteboard payload", e);
            }
        });
    }

    publishWhiteboard(payload: any) {
        if (!this.client?.connected || !this.channelId) return;
        const appUrl = this.channelType === "room" ? `/app/rooms/${this.channelId}/whiteboard` : `/app/project/${this.channelId}/whiteboard`;
        this.client.publish({
            destination: appUrl,
            body: JSON.stringify({ ...payload, senderId: this.userId! }),
        });
    }
    // --- EPHEMERAL CHAT SYNC ---
    subscribeChat(onMessage: (payload: any) => void) {
        if (!this.client?.connected || !this.channelId) return;
        const topicUrl = this.channelType === "room" ? `/topic/rooms/${this.channelId}/chat` : `/topic/project/${this.channelId}/chat`;
        
        return this.client.subscribe(topicUrl, (message: IMessage) => {
            try {
                const payload = JSON.parse(message.body);
                // Filter out own chat messages to prevent doubling local state
                if (payload.senderId && payload.senderId === this.userId) return;
                onMessage(payload);
            } catch (e) {
                console.error("Error parsing chat payload", e);
            }
        });
    }

    publishChat(payload: any) {
        if (!this.client?.connected || !this.channelId) return;
        const appUrl = this.channelType === "room" ? `/app/rooms/${this.channelId}/chat` : `/app/project/${this.channelId}/chat`;
        this.client.publish({
            destination: appUrl,
            body: JSON.stringify({ ...payload, senderId: this.userId! }),
        });
    }
}

export const voiceWs = new VoiceWebSocketService();

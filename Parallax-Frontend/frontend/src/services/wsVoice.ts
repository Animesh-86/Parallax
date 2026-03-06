import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { jwtDecode } from "jwt-decode";

// Types matching V1 Spec
export type SignalType = "CALL_JOIN" | "CALL_LEAVE" | "CALL_OFFER" | "CALL_ANSWER" | "CALL_ICE";

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
    private projectId: string | null = null;
    private onSignal: ((signal: SignalMessage | CallParticipantsMessage) => void) | null = null;

    connect(projectId: string, onSignal: (signal: SignalMessage | CallParticipantsMessage) => void, onDisconnect?: () => void): Promise<void> {
        this.projectId = projectId;
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
                webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 5000,
                debug: (str) => console.log(`[VoiceWS]: ${str}`),
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

                // Subscribe to project CALL topic
                this.client?.subscribe(`/topic/project/${projectId}/call`, (message: IMessage) => {
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

                // Subscribe to User Queue for direct messages (if backend uses it for list)
                this.client?.subscribe(`/user/queue/call`, (message: IMessage) => {
                    if (this.onSignal) {
                        try {
                            const msg = JSON.parse(message.body);
                            this.onSignal(msg);
                        } catch (e) {
                            console.error("Error parsing user queue message", e);
                        }
                    }
                });

                // Send Join Signal
                this.sendSignal({ type: "CALL_JOIN", senderId: this.userId! });
            };

            this.client.activate();
        });
    }

    sendSignal(signal: Omit<SignalMessage, "payload"> & { payload?: any }) {
        if (!this.client?.connected || !this.projectId) {
            console.warn("Voice WS not connected, cannot send signal", signal.type);
            return;
        }

        // V1 Spec: Send to /app/project/{projectId}/call
        this.client.publish({
            destination: `/app/project/${this.projectId}/call`,
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
        this.projectId = null;
        this.onSignal = null;
    }
}

export const voiceWs = new VoiceWebSocketService();

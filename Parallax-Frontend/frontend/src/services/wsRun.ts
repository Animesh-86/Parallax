import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { RunCodeBroadcastMessage, RunCodeRequestWS } from "../types/wsTypes";

let runClient: Client | null = null;
let currentOutputCallback: ((msg: RunCodeBroadcastMessage) => void) | null = null;

export function connectRunSocket(projectId: string, onOutput: (msg: RunCodeBroadcastMessage) => void) {
    // ALWAYS update the callback to the latest component instance
    currentOutputCallback = onOutput;

    if (runClient?.active) return;

    const token = localStorage.getItem("access_token");

    runClient = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        reconnectDelay: 5000,
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });


    runClient.onConnect = () => {
        console.log("🟢 Run WebSocket connected");

        runClient.subscribe(
            `/topic/projects/${projectId}/run-output`,
            frame => {
                console.log("🔥 RAW RUN FRAME:", frame.body);

                try {
                    const msg = JSON.parse(frame.body);
                    console.log("🔥 PARSED RUN MESSAGE:", msg);

                    if (currentOutputCallback) {
                        currentOutputCallback(msg);
                    }
                } catch (err) {
                    console.error("❌ Error parsing run output:", err, "frame:", frame);
                }
            },
            {
                Authorization: `Bearer ${token}`,
            }
        );
    };

    // Report STOMP / WebSocket level issues so we can surface them to the UI
    runClient.onStompError = (frame) => {
        console.error("❌ STOMP error on Run socket:", frame);
    };

    runClient.onWebSocketError = (evt) => {
        console.error("❌ Run WebSocket low-level error:", evt);
    };

    runClient.onWebSocketClose = (evt) => {
        console.warn("⚠️ Run WebSocket closed:", evt);
    };

    runClient.activate();

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
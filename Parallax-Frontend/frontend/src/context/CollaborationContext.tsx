import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { collabApi, Invitation, Collaborator } from "../services/collabApi";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

interface CollabContextType {
    pendingInvites: Invitation[];
    currentCollaborators: Collaborator[];
    refreshInvites: () => Promise<void>;
    refreshCollaborators: (projectId: string) => Promise<void>;
    acceptInvite: (invitationId: string) => Promise<void>;
    rejectInvite: (invitationId: string) => Promise<void>;
    isConnected: boolean;
    lastUpdate: number;
}

const CollabContext = createContext<CollabContextType | null>(null);

export const useCollab = () => {
    const context = useContext(CollabContext);
    if (!context) {
        throw new Error("useCollab must be used within a CollaborationProvider");
    }
    return context;
};

interface DecodedToken {
    sub: string;
    userId?: string;
    email?: string;
}

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
    const [currentCollaborators, setCurrentCollaborators] = useState<Collaborator[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [lastUpdate, setLastUpdate] = useState(0);

    // Fetch initial invites
    const refreshInvites = useCallback(async () => {
        try {
            const invites = await collabApi.getPendingInvites();
            setPendingInvites(invites);
        } catch (error) {
            console.error("Failed to fetch invites:", error);
        }
    }, []);

    // Refresh collaborators for a specific project
    const refreshCollaborators = useCallback(async (projectId: string) => {
        try {
            const collaborators = await collabApi.getProjectCollaborators(projectId);
            setCurrentCollaborators(collaborators);
        } catch (error) {
            console.error("Failed to fetch collaborators:", error);
        }
    }, []);

    const handleWebSocketEvent = useCallback((event: any) => {
        switch (event.type) {
            case "INVITE_SENT":
                toast.info(`New invite from ${event.actorEmail} for project "${event.projectName}"`);
                refreshInvites();
                setLastUpdate(Date.now());
                break;
            case "INVITE_ACCEPTED":
                toast.success(`${event.actorEmail} accepted your invite`);
                setLastUpdate(Date.now());
                break;
            case "INVITE_REJECTED":
                break;
            default:
                break;
        }
    }, [refreshInvites]);

    useEffect(() => {
        const rawToken = localStorage.getItem("access_token");
        if (!rawToken) return;

        let userId: string | undefined;
        try {
            const decoded = jwtDecode<DecodedToken>(rawToken);
            userId = decoded.userId || decoded.sub;
        } catch (e) {
            console.error("❌ Failed to decode token for WS", e);
        }

        if (!userId) return;


        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${rawToken}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);

                client.subscribe(`/topic/user/${userId}`, (message: IMessage) => {
                    try {
                        const payload = JSON.parse(message.body);
                        handleWebSocketEvent(payload);
                    } catch (err) {
                        console.error("❌ WS Message Parse Error", err);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('🛑 WS Broker error: ' + frame.headers['message']);
                console.error('Full Frame:', frame);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [handleWebSocketEvent]);

    // Actions
    const acceptInvite = async (invitationId: string) => {
        await collabApi.acceptInvite(invitationId);
        await refreshInvites();
        setLastUpdate(Date.now());
    };

    const rejectInvite = async (invitationId: string) => {
        await collabApi.rejectInvite(invitationId);
        await refreshInvites();
        setLastUpdate(Date.now());
    };

    return (
        <CollabContext.Provider value={{
            pendingInvites,
            currentCollaborators,
            refreshInvites,
            refreshCollaborators,
            acceptInvite,
            rejectInvite,
            isConnected,
            lastUpdate // Expose to consumers
        }}>
            {children}
        </CollabContext.Provider>
    );
};

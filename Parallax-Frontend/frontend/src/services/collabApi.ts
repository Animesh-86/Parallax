import api from "./api";

// Types
export interface Collaborator {
    userId?: string; // Legacy/Client-side alias
    id?: string;     // Actual API field
    email?: string;  // Actual API field might be missing, use nameOrEmail
    nameOrEmail?: string; // Actual API field from debug output
    name?: string;
    fullName?: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    role: "OWNER" | "COLLABORATOR" | "VIEWER";
    status: "ACCEPTED" | "PENDING";
    isOnline: boolean;
    invitedAt?: string;
    acceptedAt?: string;
}

export interface Invitation {
    invitationId: string;
    projectId: string;
    projectName: string;
    inviterEmail: string;
    role: "COLLABORATOR" | "VIEWER";
    status: "PENDING";
    createdAt: string;
}

export interface InviteResponse {
    invitationId: string;
    projectId: string;
    projectName: string;
    inviterEmail: string;
    role: string;
    status: string;
    createdAt: string;
}

// Room Types
export interface MeetingRoom {
    id: string;
    name: string;
    createdBy: string;
    createdAt: string;
    roomCode: string;
    active: boolean;
    codeOpen: boolean;
    whiteboardEnabled: boolean;
    collaborationMode: "INTERVIEW" | "TEAM";
    whiteboardVisibility: "PRIVATE" | "PUBLIC";
    whiteboardEditPolicy: "HOST_ONLY" | "EVERYONE";
    codeVisibility: "PRIVATE" | "PUBLIC";
    taskVisibility: "PRIVATE" | "PUBLIC";
    chatDisabled: boolean;
    screenShareDisabled: boolean;
}

export interface RoomSettingsUpdatePayload {
    codeOpen?: boolean;
    whiteboardEnabled?: boolean;
    collaborationMode?: "INTERVIEW" | "TEAM";
    whiteboardVisibility?: "PRIVATE" | "PUBLIC";
    whiteboardEditPolicy?: "HOST_ONLY" | "EVERYONE";
    codeVisibility?: "PRIVATE" | "PUBLIC";
    taskVisibility?: "PRIVATE" | "PUBLIC";
    chatDisabled?: boolean;
    screenShareDisabled?: boolean;
}

// API Endpoints
export const collabApi = {
    // --- Invitations ---

    // Invite a user to a project
    inviteCollaborator: async (projectId: string, email: string): Promise<InviteResponse> => {
        const response = await api.post(`/api/projects/${projectId}/collaborators`, { email });
        return response.data;
    },

    // Get pending invitations for the current user
    getPendingInvites: async (): Promise<Invitation[]> => {
        const response = await api.get("/api/me/invites");
        return response.data;
    },

    // Accept an invitation
    acceptInvite: async (invitationId: string): Promise<void> => {
        await api.post(`/api/me/invites/${invitationId}/accept`);
    },

    // Reject an invitation
    rejectInvite: async (invitationId: string): Promise<void> => {
        await api.post(`/api/me/invites/${invitationId}/reject`);
    },

    // --- Project Collaborators ---

    // List all collaborators for a project
    getProjectCollaborators: async (projectId: string): Promise<Collaborator[]> => {
        const response = await api.get(`/api/projects/${projectId}/collaborators`);
        return response.data;
    },

    // Remove a collaborator (or leave project if userId matches self)
    removeCollaborator: async (projectId: string, userId: string): Promise<void> => {
        await api.delete(`/api/projects/${projectId}/collaborators/${userId}`);
    },

    // Update a collaborator's role (Owner only)
    updateRole: async (projectId: string, userId: string, role: "OWNER" | "COLLABORATOR" | "VIEWER"): Promise<void> => {
        await api.patch(`/api/projects/${projectId}/collaborators/${userId}/role`, { role });
    },

    // --- Rooms ---
    
    // Create a new standalone meeting room
    createRoom: async (name: string, collaborationMode: "INTERVIEW" | "TEAM" = "TEAM"): Promise<MeetingRoom> => {
        const response = await api.post("/api/rooms", { name, collaborationMode });
        return response.data;
    },

    deleteRoom: async (roomId: string): Promise<void> => {
        await api.delete(`/api/rooms/${roomId}`);
    },

    // Get all active rooms for the user
    getActiveRooms: async (): Promise<MeetingRoom[]> => {
        const response = await api.get("/api/rooms");
        return response.data;
    },

    // Join a room by code
    joinRoom: async (roomCode: string): Promise<MeetingRoom> => {
        const response = await api.post(`/api/rooms/join/${roomCode}`);
        return response.data;
    },
    
    // Get room by ID
    getRoomById: async (roomId: string): Promise<MeetingRoom> => {
        const response = await api.get(`/api/rooms/${roomId}`);
        return response.data;
    },

    updateRoomSettings: async (roomId: string, payload: RoomSettingsUpdatePayload): Promise<MeetingRoom> => {
        try {
            const response = await api.patch(`/api/rooms/${roomId}/settings`, payload);
            return response.data;
        } catch (error: any) {
            if (error?.response?.status !== 404 && error?.response?.status !== 405) {
                throw error;
            }

            try {
                const putResponse = await api.put(`/api/rooms/${roomId}/settings`, payload);
                return putResponse.data;
            } catch (putError: any) {
                if (putError?.response?.status !== 404 && putError?.response?.status !== 405) {
                    throw putError;
                }

                const postResponse = await api.post(`/api/rooms/${roomId}/settings`, payload);
                return postResponse.data;
            }
        }
    },

    updateRoomSettingsByCode: async (roomCode: string, payload: RoomSettingsUpdatePayload): Promise<MeetingRoom> => {
        try {
            const response = await api.patch(`/api/rooms/by-code/${roomCode}/settings`, payload);
            return response.data;
        } catch (error: any) {
            if (error?.response?.status !== 404 && error?.response?.status !== 405) {
                throw error;
            }

            try {
                const putResponse = await api.put(`/api/rooms/by-code/${roomCode}/settings`, payload);
                return putResponse.data;
            } catch (putError: any) {
                if (putError?.response?.status !== 404 && putError?.response?.status !== 405) {
                    throw putError;
                }

                const postResponse = await api.post(`/api/rooms/by-code/${roomCode}/settings`, payload);
                return postResponse.data;
            }
        }
    },

    // Invite a user to a meeting room by email
    inviteToRoom: async (roomId: string, email: string): Promise<{ message: string; inviteeName: string }> => {
        const response = await api.post(`/api/rooms/${roomId}/invite`, { email });
        return response.data;
    }
};

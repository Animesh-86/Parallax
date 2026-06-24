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
    taskEditPolicy: "HOST_ONLY" | "EVERYONE";
    whiteboardEditorUserIds: string[];
    codeEditorUserIds: string[];
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
    taskEditPolicy?: "HOST_ONLY" | "EVERYONE";
    whiteboardEditorUserIds?: string[];
    codeEditorUserIds?: string[];
    chatDisabled?: boolean;
    screenShareDisabled?: boolean;
}

// API Endpoints
export const collabApi = {
    // --- Invitations ---

    // Invite a user to a project
    inviteCollaborator: async (projectId: string, email: string): Promise<InviteResponse> => {
        const response = await api.post(`/api/v1/projects/${projectId}/collaborators`, { email });
        return response.data;
    },

    // Get pending invitations for the current user
    getPendingInvites: async (): Promise<Invitation[]> => {
        const response = await api.get("/api/v1/me/invitations");
        return response.data;
    },

    // Accept an invitation
    acceptInvite: async (invitationId: string): Promise<void> => {
        await api.post(`/api/v1/me/invitations/${invitationId}/accept`);
    },

    // Reject an invitation
    rejectInvite: async (invitationId: string): Promise<void> => {
        await api.post(`/api/v1/me/invitations/${invitationId}/reject`);
    },

    // --- Project Collaborators ---

    // List all collaborators for a project
    getProjectCollaborators: async (projectId: string): Promise<Collaborator[]> => {
        const response = await api.get(`/api/v1/projects/${projectId}/collaborators`);
        return response.data;
    },

    // Remove a collaborator (or leave project if userId matches self)
    removeCollaborator: async (projectId: string, userId: string): Promise<void> => {
        await api.delete(`/api/v1/projects/${projectId}/collaborators/${userId}`);
    },

    // Update a collaborator's role (Owner only)
    updateRole: async (projectId: string, userId: string, role: "OWNER" | "COLLABORATOR" | "VIEWER"): Promise<void> => {
        await api.patch(`/api/v1/projects/${projectId}/collaborators/${userId}/role`, { role });
    },

    // --- Rooms ---
    
    // Create a new standalone meeting room
    createRoom: async (name: string, collaborationMode: "INTERVIEW" | "TEAM" = "TEAM"): Promise<MeetingRoom> => {
        const response = await api.post("/api/v1/rooms", { name, collaborationMode });
        return response.data;
    },

    deleteRoom: async (roomId: string): Promise<void> => {
        await api.delete(`/api/v1/rooms/${roomId}`);
    },

    // Get all active rooms for the user
    getActiveRooms: async (): Promise<MeetingRoom[]> => {
        const response = await api.get("/api/v1/rooms");
        return response.data;
    },

    // Join a room by code
    joinRoom: async (roomCode: string): Promise<MeetingRoom> => {
        const response = await api.post(`/api/v1/rooms/${roomCode}/participants`);
        return response.data;
    },
    
    // Get room by ID
    getRoomById: async (roomId: string): Promise<MeetingRoom> => {
        const response = await api.get(`/api/v1/rooms/${roomId}`);
        return response.data;
    },

    updateRoomSettings: async (roomId: string, payload: RoomSettingsUpdatePayload): Promise<MeetingRoom> => {
        const response = await api.patch(`/api/v1/rooms/${roomId}/settings`, payload);
        return response.data;
    },

    updateRoomSettingsByCode: async (roomCode: string, payload: RoomSettingsUpdatePayload): Promise<MeetingRoom> => {
        const response = await api.patch(`/api/v1/rooms/by-code/${roomCode}/settings`, payload);
        return response.data;
    },

    // Invite a user to a meeting room by email
    inviteToRoom: async (roomId: string, email: string): Promise<{ message: string; inviteeName: string }> => {
        const response = await api.post(`/api/v1/rooms/${roomId}/invite`, { email });
        return response.data;
    },

    // Transfer host privileges
    transferHost: async (roomId: string, newHostId: string): Promise<MeetingRoom> => {
        const response = await api.post(`/api/v1/rooms/${roomId}/transfer-host`, { newHostId });
        return response.data;
    },

    // Run code in meeting room
    runMeetingRoomCode: async (roomId: string, code: string, language: string): Promise<void> => {
        await api.post(`/api/v1/rooms/${roomId}/run`, { code, language });
    }
};

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
    }
};

import api from "./api";

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";
export type TeamStatus = "ACTIVE" | "INVITED";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  myRole: TeamRole;
  myStatus: TeamStatus;
  activeMembers: number;
  pendingInvites: number;
  autoAddMembersToProjects: boolean;
}

export interface TeamMember {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: TeamRole;
  status: TeamStatus;
  isOnline: boolean;
  invitedAt?: string;
  joinedAt?: string;
}

export interface TeamProject {
  id: string;
  name: string;
  language: string;
  teamId?: string;
  teamName?: string;
  files?: { id: string; name: string; path: string }[];
  activeSessionId?: string;
}

export const teamApi = {
  listMyTeams: async (): Promise<Team[]> => {
    const response = await api.get("/api/teams");
    return response.data;
  },

  createTeam: async (payload: { name: string; description?: string }): Promise<Team> => {
    const response = await api.post("/api/teams", payload);
    return response.data;
  },

  getTeam: async (teamId: string): Promise<Team> => {
    const response = await api.get(`/api/teams/${teamId}`);
    return response.data;
  },

  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await api.get(`/api/teams/${teamId}/members`);
    return response.data;
  },

  inviteMember: async (teamId: string, email: string, role: TeamRole = "MEMBER"): Promise<TeamMember> => {
    const response = await api.post(`/api/teams/${teamId}/members/invite`, { email, role });
    return response.data;
  },

  acceptInvite: async (teamId: string): Promise<void> => {
    await api.patch(`/api/teams/${teamId}/members/accept`);
  },

  rejectInvite: async (teamId: string): Promise<void> => {
    await api.delete(`/api/teams/${teamId}/members/reject`);
  },

  changeRole: async (teamId: string, userId: string, role: TeamRole): Promise<TeamMember> => {
    const response = await api.patch(`/api/teams/${teamId}/members/${userId}`, { role });
    return response.data;
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(`/api/teams/${teamId}/members/${userId}`);
  },

  updateTeam: async (teamId: string, payload: { name?: string; description?: string }): Promise<Team> => {
    const response = await api.patch(`/api/teams/${teamId}`, payload);
    return response.data;
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    await api.delete(`/api/teams/${teamId}`);
  },

  // ===== NEW: Team <-> Project relationship =====

  getTeamProjects: async (teamId: string): Promise<TeamProject[]> => {
    const response = await api.get(`/api/teams/${teamId}/projects`);
    return response.data;
  },

  updateAutoAddSetting: async (teamId: string, autoAdd: boolean): Promise<Team> => {
    const response = await api.patch(`/api/teams/${teamId}/settings/auto-add`, {
      autoAddMembersToProjects: autoAdd,
    });
    return response.data;
  },

  // Link/unlink a project to/from a team
  linkProjectToTeam: async (projectId: string, teamId: string | null): Promise<any> => {
    const response = await api.patch(`/api/projects/${projectId}/team`, {
      teamId: teamId,
    });
    return response.data;
  },
};
